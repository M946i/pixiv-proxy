
/** Vercel Edge Function - Pixiv 图片反向代理 */

export const config = {
  runtime: 'edge',
};

const PIXIV_HOST = 'i.pximg.net';

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
    });
  }

  const url = new URL(req.url);

  // 保留原始路径及查询参数，仅替换 hostname
  const targetUrl = `https://${PIXIV_HOST}${url.pathname}${url.search}`;

  const headers = new Headers(req.headers);

  // 移除不应该转发的请求头
  headers.delete('host');
  headers.delete('connection');

  // Pixiv 图片服务器要求的来源信息
  headers.set('Referer', 'https://www.pixiv.net/');
  headers.set('User-Agent', 'Mozilla/5.0');

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: 'follow',
    });

    const responseHeaders = new Headers(response.headers);

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set(
      'Access-Control-Allow-Methods',
      'GET, HEAD, OPTIONS'
    );

    // 保留原始 Content-Type、Content-Length 等响应头
    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Pixiv proxy failed',
        message: error.message,
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

