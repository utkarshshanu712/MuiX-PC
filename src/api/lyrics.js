const fetch = require('node-fetch');

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const response = await fetch(`https://saavn.me/lyrics?id=${id}`);
    const data = await response.json();
    
    res.status(200).json({
      status: data.status,
      lyrics: data.data?.lyrics || 'Lyrics not available'
    });
  } catch (error) {
    console.error('Error fetching lyrics:', error);
    res.status(500).json({
      status: 'ERROR',
      lyrics: 'Lyrics not available'
    });
  }
}
