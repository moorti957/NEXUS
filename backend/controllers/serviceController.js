const Service = require('../models/Service');

// ──────────────────────────────────────────────────────────
// GET /api/services
// Dashboard: केवल logged-in user की अपनी services
// ──────────────────────────────────────────────────────────
exports.getAllServices = async (req, res) => {
  try {
    
    const {
      category,
      status = 'all',                      
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const userId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    // console.log("DASHBOARD USER =>", req.user);
    // console.log("DASHBOARD USER ID =>", userId);

    const query = {
      createdBy: userId
    };

    if (status !== 'all') {
      query.status = status;
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

    const services = await Service.find(query)
      .populate('createdBy', 'name email');

    console.log("QUERY =>", query);
    console.log("SERVICES FOUND =>", services.length);
    console.log("SERVICES =>", services);

    const total = services.length;

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
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/services/public
// Public website: सभी users की active services
// (Homepage, Services Page, Marketplace के लिए)
// ──────────────────────────────────────────────────────────
exports.getPublicServices = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    // ✅ Public route: userId filter नहीं — सिर्फ active services
    const query = { status: 'active' };

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
        .populate('createdBy', 'name'),   // owner का नाम दिखाने के लिए
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
    console.error('getPublicServices error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

// ──────────────────────────────────────────────────────────
// GET /api/services/:id
// Single service — public access (homepage detail page के लिए)
// ──────────────────────────────────────────────────────────
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({ success: true, data: service });
  } catch (err) {
    console.error('getServiceById error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch service' });
  }
};

// ──────────────────────────────────────────────────────────
// POST /api/services
// Create — logged-in user की ID automatically save होगी
// ──────────────────────────────────────────────────────────
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

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required',
      });
    }

    const parseArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val.filter(Boolean);
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    // Get user id from token
    const userId =
      req.user?._id ||
      req.user?.id ||
      req.user?.userId;

    console.log('REQ USER =>', req.user);
    console.log('USER ID =>', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token',
      });
    }

    const service = await Service.create({
      createdBy: userId,

      title: title.trim(),
      description: description.trim(),
      longDescription: longDescription?.trim() || '',

      category,

      features: parseArray(features),
      technologies: parseArray(technologies),
      keywords: parseArray(keywords),

      price: price?.trim() || 'Contact for pricing',
      timeline: timeline?.trim() || 'To be discussed',

      gradient: gradient || 'from-indigo-500 to-purple-600',
      lightGradient:
        lightGradient || 'from-indigo-500/10 to-purple-600/10',

      iconType: iconType || 'code',
      status: status || 'active',
      order: order || 0,
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
      const messages = Object.values(err.errors).map(
        (e) => e.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create service',
    });
  }
};

// ──────────────────────────────────────────────────────────
// PUT /api/services/:id
// Update — ownership check जरूरी
// ──────────────────────────────────────────────────────────
exports.updateService = async (req, res) => {
  try {
    // ✅ FIX: _id और createdBy दोनों match होने चाहिए
    const service = await Service.findOne({
      _id: req.params.id,
     createdBy:
  req.user?._id ||
  req.user?.id ||
  req.user?.userId,     // दूसरे user की service edit नहीं होगी
    });

    // Admin bypass
    if (!service && req.user.role !== 'admin') {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you are not authorized to edit it',
      });
    }

    // Admin case: ownership check bypass करके find करें
    const targetService = service || await Service.findById(req.params.id);
    if (!targetService) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const parseArray = (val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val.filter(Boolean);
      return val.split(',').map((s) => s.trim()).filter(Boolean);
    };

    const updates = { ...req.body };

    // createdBy को overwrite होने से बचाएं
    delete updates.createdBy;

    if (updates.features) updates.features = parseArray(updates.features);
    if (updates.technologies) updates.technologies = parseArray(updates.technologies);
    if (updates.keywords) updates.keywords = parseArray(updates.keywords);

    const updated = await Service.findByIdAndUpdate(
      targetService._id,
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

// ──────────────────────────────────────────────────────────
// DELETE /api/services/:id
// Delete — ownership check जरूरी
// ──────────────────────────────────────────────────────────
exports.deleteService = async (req, res) => {
  try {
    // ✅ FIX: findOneAndDelete में createdBy filter
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      createdBy:
  req.user?._id ||
  req.user?.id ||
  req.user?.userId,   // दूसरे user की service delete नहीं होगी
    });

    // Admin bypass
    if (!service) {
      if (req.user.role === 'admin') {
        const adminDel = await Service.findByIdAndDelete(req.params.id);
        if (!adminDel) {
          return res.status(404).json({ success: false, message: 'Service not found' });
        }
        return res.json({ success: true, message: 'Service deleted by admin' });
      }
      return res.status(404).json({
        success: false,
        message: 'Service not found or you are not authorized to delete it',
      });
    }

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (err) {
    console.error('deleteService error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
};

// ──────────────────────────────────────────────────────────
// PATCH /api/services/:id/status
// Toggle status — ownership check जरूरी
// ──────────────────────────────────────────────────────────
exports.toggleServiceStatus = async (req, res) => {
  try {
    // ✅ FIX: ownership check add किया (पहले यह था ही नहीं)
    const service = await Service.findOne({
      _id: req.params.id,
      createdBy:
  req.user?._id ||
  req.user?.id ||
  req.user?.userId,
    });

    // Admin bypass
    const targetService =
      service ||
      (req.user.role === 'admin'
        ? await Service.findById(req.params.id)
        : null);

    if (!targetService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or you are not authorized',
      });
    }

    targetService.status =
      targetService.status === 'active' ? 'inactive' : 'active';
    await targetService.save();

    res.json({
      success: true,
      message: `Service ${targetService.status === 'active' ? 'activated' : 'deactivated'}`,
      data: { status: targetService.status },
    });
  } catch (err) {
    console.error('toggleServiceStatus error:', err);
    res.status(500).json({ success: false, message: 'Failed to toggle status' });
  }
};