const pool = require("../config/database");

const products = [
  {
    name: "Sheger Boot",
    category: "Shoes",
    price: 4200,
    salePrice: null,
    stock: 18,
    featured: true,
    image: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1400&q=80",
    description:
      "A full-grain Ethiopian leather boot, cut and lasted in Tatek. The upper is a single hide with a hand-stitched welt, brass eyelets, and a leather sole that takes a polish. Made for daily wear on the streets of Sheger City. The hide darkens slightly with wear and should be conditioned twice a year. Origin: Tatek Industrial Zone. Tannage: vegetable. Finish: aniline, uncoated.",
  },
  {
    name: "Tatek Derby",
    category: "Shoes",
    price: 3600,
    salePrice: 3100,
    stock: 22,
    featured: true,
    image: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1400&q=80",
    description:
      "An open-laced derby in full-grain calf, closed by hand on the Atlantic bench. The quarters are cut so the hide can flex across the instep, with a leather lining and a stitched waist. Suitable for the office and the walk home. Origin: Tatek Industrial Zone, Sheger City. Tannage: vegetable. Sole: leather. Care: brush off dust, condition the upper twice a year, keep shoe trees in overnight.",
  },
  {
    name: "Bench Satchel",
    category: "Bags",
    price: 5400,
    salePrice: null,
    stock: 14,
    featured: true,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1400&q=80",
    description:
      "A structured satchel in full-grain hide, with a rolled handle, a stitched gusset, and a brass tuck lock. The body is one panel so the grain stays continuous across the front. Lined in leather, with a slip pocket sized for a notebook. Cut in Tatek for daily carry. Origin: Sheger City. Tannage: vegetable. Hardware: solid brass. Care: wipe with a dry cloth and keep it stuffed when it is not in use.",
  },
  {
    name: "Day Belt",
    category: "Belts",
    price: 1450,
    salePrice: null,
    stock: 40,
    featured: true,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80",
    description:
      "A 35 mm belt strap cut from the firmer part of a full-grain hide, edged and burnished by hand. The buckle is solid brass and the keeper is stitched, not glued. Five holes, spaced for a normal waist. It will crease where it is worn and that crease is the point. Origin: Tatek Industrial Zone. Tannage: vegetable. Width: 35 mm. Care: hang it straight and condition the strap once a year.",
  },
  {
    name: "Pocket Wallet",
    category: "Small goods",
    price: 980,
    salePrice: 850,
    stock: 36,
    featured: false,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80",
    description:
      "A bifold wallet in a thinner cut of the same full-grain hide used for the shoes. Six card slots, two notes compartments, and edges painted and burnished so they do not fray. Slim enough for a front pocket. Origin: Sheger City. Tannage: vegetable. Stitching: saddle stitch in linen. Care: empty it overnight now and then so the hide can dry.",
  },
  {
    name: "Workshop Glove",
    category: "Gloves",
    price: 1680,
    salePrice: null,
    stock: 20,
    featured: true,
    image: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1200&q=80",
    description:
      "An unlined glove in soft full-grain leather, cut so the thumb seam sits off the grip. The hide is thinner than the boot leather and was chosen for flex, not for stiffness. Stitched in linen and finished without a coating, so the hand shows through the grain. Origin: Tatek Industrial Zone. Tannage: vegetable. Care: wear them, then rest them flat. Do not wash.",
  },
  {
    name: "Sheger Jacket",
    category: "Jackets",
    price: 8900,
    salePrice: null,
    stock: 10,
    featured: true,
    image: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1400&q=80",
    description:
      "A leather jacket cut from a heavier full-grain hide than the shoes, with a set collar, a metal zip, and sleeves that break at the wrist. The body is lined in leather and the seams are saddle-stitched so the jacket can be worn hard. It takes the shape of the shoulders after a few weeks. Origin: Tatek Industrial Zone, Sheger City. Tannage: vegetable. Care: hang it on a wide hanger, brush the hide, and condition it once a year. Do not wash.",
  },
  {
    name: "Rider Jacket",
    category: "Jackets",
    price: 7600,
    salePrice: 6900,
    stock: 8,
    featured: true,
    image: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1400&q=80",
    description:
      "A shorter rider jacket in a warmer hide, zipped to the collar and cut close through the chest. The leather is left uncoated so the grain stays open, with leather lining at the shoulders and a stitched hem. Made for the bike and the walk after. Origin: Sheger City. Tannage: vegetable. Hardware: metal zip. Care: wipe off dust and let it dry on a hanger. Do not fold it.",
  },
  {
    name: "Bench Apron",
    category: "Aprons",
    price: 3200,
    salePrice: null,
    stock: 16,
    featured: true,
    image: "",
    description:
      "A workshop apron in the firm part of a full-grain hide, with a bib, a waist tie, and a neck strap that sits off the throat. The skirt covers the thigh and the edges are burnished so they do not fray at the bench. Pockets are stitched, not glued, and sized for a knife and a phone. Cut in Tatek for people who work with their hands. Origin: Tatek Industrial Zone. Tannage: vegetable. Care: wipe it down and hang it by the neck strap. Do not wash.",
  },
];

const categories = [
  {
    name: "Shoes",
    image: "https://images.unsplash.com/photo-1449505278894-297fdb3edbc1?auto=format&fit=crop&w=1400&q=80",
    description: "Low shoes, derbies, and boots. Full-grain uppers, leather soles, closed by hand in Tatek.",
  },
  {
    name: "Bags",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1400&q=80",
    description: "Satchels and carry pieces cut from one panel, with brass hardware and a leather lining.",
  },
  {
    name: "Belts",
    image: "",
    description: "35 mm straps from the firmer hide, edges burnished, brass buckle, five holes.",
  },
  {
    name: "Small goods",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80",
    description: "Wallets and pocket pieces in a thinner cut of the same full-grain leather.",
  },
  {
    name: "Gloves",
    image: "",
    description: "Unlined gloves in a soft hide, thumb seam set off the grip, stitched in linen.",
  },
  {
    name: "Jackets",
    image: "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=1400&q=80",
    description: "Leather jackets cut in Sheger City. Heavier hide, leather lined, made to take a shoulder.",
  },
  {
    name: "Aprons",
    image: "",
    description: "Workshop aprons in firm full-grain hide, with a bib, a waist tie, and stitched pockets.",
  },
];

async function main() {
  const connection = await pool.getConnection();
  try {
    const categoryIds = {};
    for (const category of categories) {
      const [existing] = await connection.query("SELECT id FROM categories WHERE name = ?", [category.name]);
      if (existing.length > 0) {
        categoryIds[category.name] = existing[0].id;
        await connection.query(
          "UPDATE categories SET description = ?, image_url = NULLIF(?, '') WHERE id = ?",
          [category.description, category.image, existing[0].id]
        );
        console.log(`Updated category ${category.name}`);
      } else {
        const [created] = await connection.query(
          "INSERT INTO categories (name, description, image_url) VALUES (?, ?, NULLIF(?, ''))",
          [category.name, category.description, category.image]
        );
        categoryIds[category.name] = created.insertId;
        console.log(`Inserted category ${category.name}`);
      }
    }

    await connection.query(
      `UPDATE products SET category_id = ? WHERE name = 'Betty Shoes' AND category_id IS NULL`,
      [categoryIds.Shoes]
    );

    const [betty] = await connection.query(
      "SELECT id, description FROM products WHERE name = ?",
      ["Betty Shoes"]
    );
    if (betty.length > 0) {
      const current = (betty[0].description || "").trim();
      if (!current || current.toLowerCase() === "testing") {
        await connection.query(
          "UPDATE products SET description = ?, is_published = 1, stock = GREATEST(stock, 12) WHERE id = ?",
          [
            "Betty is a low shoe in full-grain Ethiopian leather, closed by hand in Tatek. The upper is uncoated aniline hide, so the grain stays visible, with a leather lining and a stitched welt. It is cut for a full day of walking. Origin: Tatek Industrial Zone, Sheger City. Tannage: vegetable. Sole: leather. Care: brush, condition twice a year, and use shoe trees.",
            betty[0].id,
          ]
        );
        console.log("Updated Betty Shoes description");
      }
    }

    for (const product of products) {
      const [found] = await connection.query("SELECT id FROM products WHERE name = ?", [product.name]);
      if (found.length > 0) {
        console.log(`Already present: ${product.name}`);
        continue;
      }
      const images = product.image ? JSON.stringify([product.image]) : JSON.stringify([]);
      await connection.query(
        `INSERT INTO products
          (name, description, price, category_id, stock, intro_image, images, is_published, is_featured, is_on_sale, sale_price)
         VALUES (?, ?, ?, ?, ?, NULLIF(?, ''), ?, 1, ?, ?, ?)`,
        [
          product.name,
          product.description,
          product.price,
          categoryIds[product.category],
          product.stock,
          product.image,
          images,
          product.featured ? 1 : 0,
          product.salePrice ? 1 : 0,
          product.salePrice,
        ]
      );
      console.log(`Inserted ${product.name}`);
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
