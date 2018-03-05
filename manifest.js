/**
 * Site Manifest
 * Contains all page details for output and template variables.
 */

var manifest = {
  /**
   * Global variables
   * Accessible by all pages.
   */
  globals: {
  },
  /**
   * Page-specific variables
   * Iterated by build script to generate HTML pages.
   * ---
   * Build-related variables:
   *   {string} id - Page ID; auto-inserted during build using the prop name.
   *   {string} output - Output path (required).
   *   {string} template - Base template path (required).
   *   {number} priority - Sitemap priority (optional).
   * Other variables:
   *   {string} title - Page title.
   *   {string} description - Page meta description.
   *   {string} ogImage - Page Open Graph image path.
   */
  pages: {
    index: {
      output: 'index.html',
      template: 'templates/index.ejs',
      priority: 1.0,
      title: 'Website',
      description: 'A very simple website.'
    },
    error: {
      output: 'error.html',
      template: 'templates/error.ejs',
      priority: 0,
      title: 'Error',
      description: 'An error page.'
    }
  }
};

module.exports = manifest;
