const Service = require('../models/Service');

// ──────────────────────────────────────────
// GET /api/services  – public, all active
// ──────────────────────────────────────────
exports.getAllServices = async (req, res) => {
  try {
    const { category, status = 'active', search, page = 1, limit = 20 } = req.query;

    const query = {};

    // Admin can see all statuses; public only sees active
    if (req.user?.role === 'admin') {
      if (status !== 'all') query.status = status;
    } else {
      query.status = 'active';
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [services, total] = await Promise.all([
      Service.find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('createdBy', 'name email'),
      Service.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        services,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (err) {
    console.error('getAllServices error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

// ──────────────────────────────────────────
// GET /api/services/:id
// ──────────────────────────────────────────
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).populate('createdBy', 'name email');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    res.json({ success: true, data: service });
  } catch (err) {
    console.error('getServiceById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch service' });
  }
};

// ──────────────────────────────────────────
// POST /api/services  – authenticated
// ──────────────────────────────────────────
exports.createService = async (req, res) => {
  try {
    const {
      title,
      description,
      longDescription,
      category,
      features,
      technologies,
      price,
      timeline,
      keywords,
      gradient,
      lightGradient,
      iconType,
      status,
      order,
    } = req.body;

    // Basic validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required',
      });
    }

    // Parse array fields if they arrive as comma-separated strings
    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    const service = await Service.create({
      title: title.trim(),
      description: description.trim(),
      longDescription: longDescription?.trim() || '',
      category,
      features: parseArray(features),
      technologies: parseArray(technologies),
      price: price?.trim() || 'Contact for pricing',
      timeline: timeline?.trim() || 'To be discussed',
      keywords: parseArray(keywords),
      gradient: gradient || 'from-indigo-500 to-purple-600',
      lightGradient: lightGradient || 'from-indigo-500/10 to-purple-600/10',
      iconType: iconType || 'code',
      status: status || 'active',
      order: order || 0,
      createdBy: req.user?._id,
    });

    await service.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service,
    });
  } catch (err) {
    console.error('createService error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

// ──────────────────────────────────────────
// PUT /api/services/:id – authenticated
// ──────────────────────────────────────────
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Only creator or admin can update
    if (
      service.createdBy?.toString() !== req.user?._id?.toString() &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const parseArray = (val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.filter(Boolean);
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    const updates = { ...req.body };
    if (updates.features) updates.features = parseArray(updates.features);
    if (updates.technologies) updates.technologies = parseArray(updates.technologies);
    if (updates.keywords) updates.keywords = parseArray(updates.keywords);

    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({ success: true, message: 'Service updated', data: updated });
  } catch (err) {
    console.error('updateService error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Failed to update service' });
  }
};

// ──────────────────────────────────────────
// DELETE /api/services/:id – authenticated
// ──────────────────────────────────────────
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (
      service.createdBy?.toString() !== req.user?._id?.toString() &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await service.deleteOne();
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    console.error('deleteService error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};

// ──────────────────────────────────────────
// PATCH /api/services/:id/status – toggle active/inactive
// ──────────────────────────────────────────
exports.toggleServiceStatus = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.status = service.status === 'active' ? 'inactive' : 'active';
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.status === 'active' ? 'activated' : 'deactivated'}`,
      data: { status: service.status },
    });
  } catch (err) {
    console.error('toggleServiceStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};