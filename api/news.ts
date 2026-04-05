export default async function handler(req: any, res: any) {
  const { topic } = req.query;
  const apiKey = process.env.NEWS_API_KEY;

  if (!topic) {
    return res.status(400).json({ status: 'error', message: 'No topic provided' });
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic as string)}&sortBy=relevancy&pageSize=10&language=en&apiKey=${apiKey}`
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch news' });
  }
}
