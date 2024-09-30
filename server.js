const express = require('express');
const mariadb = require('mariadb');
const { body, param, validationResult } = require('express-validator');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(express.json());

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'notes_db',
  port: 3306,
  connectionLimit: 5
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Notes API',
      version: '1.0.0',
      description: 'API documentation for Notes CRUD operations',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated id of the note
 *         title:
 *           type: string
 *           description: The title of the note
 *         content:
 *           type: string
 *           description: The content of the note
 *       example:
 *         id: 1
 *         title: Sample Note
 *         content: This is a sample note.
 */

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Retrieve all notes
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 */
app.get('/api/notes', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM notes');
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving notes');
  }
});

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       201:
 *         description: Note created successfully
 */
app.post(
  '/api/notes',
  [
    body('title').isString().withMessage('Title must be a string').trim().escape(),
    body('content').isString().withMessage('Content must be a string').trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content } = req.body;

    try {
      const conn = await pool.getConnection();
      const result = await conn.query('INSERT INTO notes (title, content) VALUES (?, ?)', [title, content]);
      conn.release();
      res.status(201).json({ message: 'Note added successfully', noteId: result.insertId });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error adding note');
    }
  }
);

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       200:
 *         description: Note updated successfully
 */
app.put(
  '/api/notes/:id',
  [
    param('id').isInt().withMessage('ID must be an integer'),
    body('title').optional().isString().trim().escape(),
    body('content').optional().isString().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content } = req.body;

    try {
      const conn = await pool.getConnection();
      const result = await conn.query('UPDATE notes SET title = ?, content = ? WHERE id = ?', [title, content, id]);
      conn.release();
      if (result.affectedRows === 0) {
        res.status(404).send('Note not found');
      } else {
        res.json({ message: 'Note updated successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error updating note');
    }
  }
);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Delete a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The note ID
 *     responses:
 *       200:
 *         description: Note deleted successfully
 */
app.delete(
  '/api/notes/:id',
  [param('id').isInt().withMessage('ID must be an integer')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    try {
      const conn = await pool.getConnection();
      const result = await conn.query('DELETE FROM notes WHERE id = ?', [id]);
      conn.release();
      if (result.affectedRows === 0) {
        res.status(404).send('Note not found');
      } else {
        res.json({ message: 'Note deleted successfully' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).send('Error deleting note');
    }
  }
);

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The note ID
 *     responses:
 *       200:
 *         description: A single note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found
 */
app.get('/api/notes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM notes WHERE id = ?', [id]);
    conn.release();

    if (rows.length === 0) {
      return res.status(404).send('Note not found');
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving note');
  }
});

/**
 * @swagger
 * /api/notes/title/{title}:
 *   get:
 *     summary: Get notes by title
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: title
 *         required: true
 *         schema:
 *           type: string
 *         description: The title of the note
 *     responses:
 *       200:
 *         description: A list of notes with the specified title
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 */
app.get('/api/notes/title/:title', async (req, res) => {
  const { title } = req.params;

  try {
    const conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM notes WHERE title = ?', [title]);
    conn.release();

    if (rows.length === 0) {
      return res.status(404).send('No notes found with the given title');
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving notes');
  }
});

/**
 * @swagger
 * /api/notes/{id}:
 *   patch:
 *     summary: Partially update a note by ID
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Note'
 *     responses:
 *       200:
 *         description: Note updated successfully
 *       404:
 *         description: Note not found
 */
app.patch(
  '/api/notes/:id',
  [
    param('id').isInt().withMessage('ID must be an integer'),
    body('title').optional().isString().trim().escape(),
    body('content').optional().isString().trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, content } = req.body;

    try {
      const conn = await pool.getConnection();

      // Check if the note exists
      const existingNote = await conn.query('SELECT * FROM notes WHERE id = ?', [id]);
      if (existingNote.length === 0) {
        conn.release();
        return res.status(404).send('Note not found');
      }

      // Perform the partial update
      const result = await conn.query(
        'UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content) WHERE id = ?',
        [title, content, id]
      );
      conn.release();

      res.json({ message: 'Note updated successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error updating note');
    }
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Notes app listening at http://localhost:${port}`);
});

