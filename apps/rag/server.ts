import "dotenv/config"
import express from "express"
import { ask, ingest } from "./rag"

const app = express()
app.use(express.json())
const port = process.env.PORT || 9003
app.post("/rag/ask", async (req, res) => {
  try {
    const { question } = req.body
    if (!question) {
      return res.status(400).json({ error: "Question required" })
    }

    const answer = await ask(question)
    res.json({ answer })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "RAG error" })
  }
})


app.post("/rag/ingest", async (req, res) => {
  try {
    const { content, metadata = {} } = req.body
    if (!content) {
      return res.status(400).json({ error: "content required" })
    }

    const answer = await ingest(content, metadata)
    res.json({ answer })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "RAG error" })
  }
})

app.listen(port, () => {
  console.log(`RAG service running on port ${port}`)
})
