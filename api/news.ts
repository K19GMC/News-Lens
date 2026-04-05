export default async function handler(req: any, res: any) {
  const { topic } = req.query;
  const apiKey = process.env.NEWS_API_KEY;
  
  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${apiKey}`
  );
  const data = await response.json();
  res.json(data);
}
