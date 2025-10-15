const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false,
});

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const { brand_id, id } = req.query;

      if (id) {
        const result = await pool.query(
          `SELECT ps.*,
                  COALESCE(
                    json_agg(
                      json_build_object(
                        'id', po.id,
                        'offer_text', po.offer_text,
                        'expiration_date', po.expiration_date
                      )
                    ) FILTER (WHERE po.id IS NOT NULL),
                    '[]'
                  ) as offers
           FROM products_services ps
           LEFT JOIN product_offers po ON ps.id = po.product_service_id
           WHERE ps.id = $1
           GROUP BY ps.id`,
          [id]
        );
        res.status(200).json({
          success: true,
          data: result.rows[0] || null
        });
      } else if (brand_id) {
        const result = await pool.query(
          `SELECT ps.*,
                  COALESCE(
                    json_agg(
                      json_build_object(
                        'id', po.id,
                        'offer_text', po.offer_text,
                        'expiration_date', po.expiration_date
                      )
                    ) FILTER (WHERE po.id IS NOT NULL),
                    '[]'
                  ) as offers
           FROM products_services ps
           LEFT JOIN product_offers po ON ps.id = po.product_service_id
           WHERE ps.brand_id = $1
           GROUP BY ps.id
           ORDER BY ps.created_at DESC`,
          [brand_id]
        );
        res.status(200).json({
          success: true,
          data: result.rows
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'brand_id or id is required'
        });
      }
    }
    else if (req.method === 'POST') {
      const { brand_id, name, category, description, price, features, image_url, image_urls, default_image_url, cturl, offers } = req.body;

      if (!brand_id || !name) {
        res.status(400).json({
          success: false,
          error: 'brand_id and name are required'
        });
        return;
      }

      // Start a transaction for inserting product and offers
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Insert product/service
        const result = await client.query(
          `INSERT INTO products_services (brand_id, name, category, description, price, features, image_url, image_urls, default_image_url, cturl)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [
            brand_id,
            name,
            category,
            description,
            price,
            features || [],
            image_url || null,
            image_urls || [],
            default_image_url || null,
            cturl || null
          ]
        );

        const productId = result.rows[0].id;

        // Insert offers if provided
        if (offers && Array.isArray(offers) && offers.length > 0) {
          for (const offer of offers) {
            if (offer.offer_text && offer.offer_text.trim() !== '') {
              await client.query(
                `INSERT INTO product_offers (product_service_id, offer_text, expiration_date)
                 VALUES ($1, $2, $3)`,
                [productId, offer.offer_text, offer.expiration_date || null]
              );
            }
          }
        }

        await client.query('COMMIT');

        // Fetch the complete product with offers
        const finalResult = await client.query(
          `SELECT ps.*,
                  COALESCE(
                    json_agg(
                      json_build_object(
                        'id', po.id,
                        'offer_text', po.offer_text,
                        'expiration_date', po.expiration_date
                      )
                    ) FILTER (WHERE po.id IS NOT NULL),
                    '[]'
                  ) as offers
           FROM products_services ps
           LEFT JOIN product_offers po ON ps.id = po.product_service_id
           WHERE ps.id = $1
           GROUP BY ps.id`,
          [productId]
        );

        res.status(201).json({
          success: true,
          data: finalResult.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    else if (req.method === 'PUT') {
      const { id, name, category, description, price, features, image_url, image_urls, default_image_url, cturl, offers } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'id is required'
        });
        return;
      }

      // Start a transaction for updating product and offers
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Update product/service
        const result = await client.query(
          `UPDATE products_services
           SET name = COALESCE($2, name),
               category = COALESCE($3, category),
               description = COALESCE($4, description),
               price = COALESCE($5, price),
               features = COALESCE($6, features),
               image_url = COALESCE($7, image_url),
               image_urls = COALESCE($8, image_urls),
               default_image_url = COALESCE($9, default_image_url),
               cturl = COALESCE($10, cturl),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1
           RETURNING *`,
          [
            id,
            name,
            category,
            description,
            price,
            features || null,
            image_url,
            image_urls,
            default_image_url,
            cturl
          ]
        );

        if (result.rowCount === 0) {
          await client.query('ROLLBACK');
          res.status(404).json({
            success: false,
            error: 'Product/service not found'
          });
          client.release();
          return;
        }

        // Handle offers update if provided
        if (offers !== undefined) {
          // Delete existing offers
          await client.query(
            'DELETE FROM product_offers WHERE product_service_id = $1',
            [id]
          );

          // Insert new offers
          if (Array.isArray(offers) && offers.length > 0) {
            for (const offer of offers) {
              if (offer.offer_text && offer.offer_text.trim() !== '') {
                await client.query(
                  `INSERT INTO product_offers (product_service_id, offer_text, expiration_date)
                   VALUES ($1, $2, $3)`,
                  [id, offer.offer_text, offer.expiration_date || null]
                );
              }
            }
          }
        }

        await client.query('COMMIT');

        // Fetch the complete product with offers
        const finalResult = await client.query(
          `SELECT ps.*,
                  COALESCE(
                    json_agg(
                      json_build_object(
                        'id', po.id,
                        'offer_text', po.offer_text,
                        'expiration_date', po.expiration_date
                      )
                    ) FILTER (WHERE po.id IS NOT NULL),
                    '[]'
                  ) as offers
           FROM products_services ps
           LEFT JOIN product_offers po ON ps.id = po.product_service_id
           WHERE ps.id = $1
           GROUP BY ps.id`,
          [id]
        );

        res.status(200).json({
          success: true,
          data: finalResult.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }
    else if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'id is required'
        });
        return;
      }

      const result = await pool.query(
        'DELETE FROM products_services WHERE id = $1 RETURNING *',
        [id]
      );

      if (result.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Product/service not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Product/service deleted successfully'
      });
    }
    else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Products/services error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};
