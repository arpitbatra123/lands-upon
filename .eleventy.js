module.exports = (eleventyConfig) => {
    eleventyConfig.addPassthroughCopy('favicon.ico');
    eleventyConfig.addPassthroughCopy('favicon.svg');
    eleventyConfig.addPassthroughCopy('og.jpg');
    eleventyConfig.addPassthroughCopy('favicon.svg');
    eleventyConfig.addPassthroughCopy('assets');
    eleventyConfig.addPassthroughCopy('script.js');
    return {
        // Use liquid in html templates
        htmlTemplateEngine: 'liquid'
    };
};
