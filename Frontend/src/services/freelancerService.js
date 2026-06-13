// services/freelancerService.js
// Add these functions to your existing api service file, or import from here.

import api from './api'; // your existing axios instance

/**
 * Fetch a freelancer's public profile by their MongoDB _id
 */
export const getFreelancerProfile = async (id) => {
  const res = await api.get(`/freelancers/${id}`);
  return res.data.data;
};

/**
 * Send a team invite to a freelancer (reuses existing endpoint)
 */
export const sendTeamInvite = async (memberId) => {
  const res = await api.post('/team/invite', { memberId });
  return res.data;
};