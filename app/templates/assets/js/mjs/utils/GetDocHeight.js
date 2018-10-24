/**
 * Get document height
 *
 * @return integer
 */
export default function() {
  const body = document.body;
  const html = document.documentElement;
  const height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight );

  return height;
}
