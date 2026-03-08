export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return serveDefaultHtml(req, res);
    }

    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'knitly-92828';

    try {
        // Fetch track data using Firebase REST API (fastest, no admin SDK required for public read)
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/tracks/${id}`);

        if (!response.ok) {
            return serveDefaultHtml(req, res);
        }

        const data = await response.json();

        if (!data || !data.fields) {
            return serveDefaultHtml(req, res);
        }

        const title = data.fields.title?.stringValue || 'Track';
        const artist = data.fields.authorName?.stringValue || 'Artist';
        const coverArtUrl = data.fields.coverArtUrl?.stringValue || 'https://knitly-2-0.vercel.app/logo512.png';
        const description = data.fields.description?.stringValue || `Слухайте "${title}" від ${artist} на Knitly`;

        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const pageTitle = `${title} - ${artist} | Knitly`;

        const metaTags = `
            <title>${pageTitle}</title>
            <meta name="description" content="${description}" />
            <meta property="og:type" content="music.song" />
            <meta property="og:url" content="${protocol}://${host}/track/${id}" />
            <meta property="og:title" content="${pageTitle}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${coverArtUrl}" />
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:title" content="${pageTitle}" />
            <meta property="twitter:description" content="${description}" />
            <meta property="twitter:image" content="${coverArtUrl}" />
        `;

        try {
            // Fetch the actual built index.html from our deployment
            const indexRes = await fetch(`${protocol}://${host}/index.html`);
            let indexHtml = await indexRes.text();

            // Remove previous <title> and generic description if any
            indexHtml = indexHtml.replace(/<title>.*?<\/title>/i, '');
            indexHtml = indexHtml.replace(/<meta name="description".*?>/i, '');

            // Inject tags right after <head>
            indexHtml = indexHtml.replace('<head>', `<head>\n${metaTags}`);

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300'); // Cache on Vercel Edge for 60s
            return res.status(200).send(indexHtml);

        } catch (e) {
            console.error('Failed to parse index.html:', e);
            throw e; // Fallback to basic html
        }

    } catch (error) {
        console.error('Error in og tag generation:', error);
        return serveDefaultHtml(req, res);
    }
}

async function serveDefaultHtml(req, res) {
    try {
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const htmlRes = await fetch(`${protocol}://${host}/index.html`);
        const html = await htmlRes.text();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (e) {
        // Ultimate fallback
        res.status(200).send('<!DOCTYPE html><html><head><title>Knitly</title></head><body><p>App is loading...</p></body></html>');
    }
}
