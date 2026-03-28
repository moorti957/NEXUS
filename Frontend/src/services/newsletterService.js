export const subscribeToNewsletter = async (email) => {
  // API call to your backend
  try {
    const response = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) throw new Error('Subscription failed');
    
    return await response.json();
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    throw error;
  }
};