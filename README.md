# Multiboxd 🎬

Multiboxd is a lightweight, self-hosted Stremio add-on that integrates your Letterboxd profile catalogs directly into Stremio. It scrapes Letterboxd (watchlist, diary, friends activity, and custom lists) and enhances the grid with localized poster layouts using TMDB metadata, without overriding or injecting custom streaming sources (keeping it fully compatible with your existing streaming add-ons).

---

## Features ✨

- **Watchlist Sync**: Sync your public Letterboxd Watchlist.
- **Diary Integration**: Keep track of your recently watched films.
- **Friends Activity**: See what your friends are watching on Letterboxd.
- **Personalized Recommendations**: Aggregates recommendations from TMDB based on your highest-rated films in your Diary, automatically filtering out films you've already logged as watched.
- **Custom Public Lists**: Paste any public Letterboxd list URL to display it as a custom catalog in Stremio.
- **Catalog Reordering**: Easily reorder all catalogs directly from the configuration web UI.
- **Localized Posters**: Multi-language support (Italian, Spanish, French, etc.) using TMDB API keys for posters.
- **Ultra-lightweight**: No database required. Everything is client-side and encoded securely in the addon installation URL.

---

## How to Run with Docker 🐳

You can clone the repository and spin up the add-on using Docker in less than a minute.

### 1. Clone the repository
```bash
git clone https://github.com/Affoghiamoci/Multiboxd.git
cd Multiboxd
```

### 2. Run with Docker Compose
Simply start the service in background mode:
```bash
docker compose up -d --build
```
The configuration UI will be available at **[http://localhost:3000](http://localhost:3000)**.

### 3. Run with Docker CLI
If you prefer not to use Compose:
```bash
# Build the image
docker build -t multiboxd .

# Run the container
docker run -d -p 3000:3000 --name multiboxd multiboxd
```

---

## Manual Installation (Local Node.js) ⚙️

If you want to run the project without Docker:

### Prerequisites
- Node.js 18+
- npm

### Installation steps
```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Or build & start in production mode
npm run build
npm start
```
The server will run on **[http://localhost:3000](http://localhost:3000)**.

---

## Configuration & Usage 📡

1. Open the configuration page in your browser (`http://localhost:3000`).
2. **Letterboxd Profile**: Enter your username to load Watchlist, Diary, and Friends Activity (no password needed, works with public profiles).
3. **TMDB Key (Optional but Recommended)**:
   - Provide a free API Key from [TheMovieDB](https://www.themoviedb.org/settings/api).
   - This unlocks localized posters (e.g. Italian titles/art instead of English defaults) and the **Recommended** catalog.
4. **Order Catalogs**: Use the **▲ / ▼** buttons to arrange the order of your catalogs.
5. Click **Install in Stremio** or copy the generated link to manually install it in your Stremio client.

---

## Development & Tech Stack 🛠️

- **Framework**: Next.js 15 (App Router)
- **Styling**: Vanilla CSS (Custom Design System)
- **Scraper**: Cheerio & Playwright
- **Cache**: In-memory node-cache (1 hour TTL)

---

## Support ☕

If you like this project, consider supporting me:
- **Ko-fi**: [https://ko-fi.com/affogo](https://ko-fi.com/affogo)
