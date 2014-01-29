({
    baseUrl: ".",
    appDir: ".",
    dir: "../build",
    paths: {
        "scripts": '.',// needed to tell optimizer that this directory is scripts
        "elements": "../elements",
        "upfront-data": "empty:", // Makes builder ignore this i.e. it will not try to include it into optimization.
        "maps_context_menu": "empty:",// Leave out maps context menu or it will not initialize properly
        "backbone": "../../../../wp-includes/js/backbone.min", // this assumes standard wp directory arrangement.
        "underscore": "../../../../wp-includes/js/underscore.min",
        "models": "upfront/upfront-models",
        "views": "upfront/upfront-views",
        "editor_views": "upfront/upfront-views-editor",
        "util": "upfront/upfront-util",
        "behaviors": "upfront/upfront-behaviors",
        "application": "upfront/upfront-application",
        "objects": "upfront/upfront-objects",
        "media": "upfront/upfront-media",
        "content": "upfront/upfront-content",
        "spectrum": "spectrum/spectrum",
        "responsive": "responsive",
        "uaccordion": "../elements/upfront-accordion/js/uaccordion",
        "ucomment": "../elements/upfront-comment/js/ucomment",
        "ucontact": "../elements/upfront-contact-form/js/ucontact",
        "ugallery": "../elements/upfront-gallery/js/ugallery",
        "uimage": "../elements/upfront-image/js/uimage",
        "upfront-like-box": "../elements/upfront-like-box/js/upfront-like-box",
        "upfront_login": "../elements/upfront-login/js/upfront_login",
        "upfront_maps": "../elements/upfront-maps/js/upfront_maps",
        "upfront-navigation": "../elements/upfront-navigation/js/upfront-navigation",
        "uposts": "../elements/upfront-posts/js/uposts",
        "usearch": "../elements/upfront-search/js/usearch",
        "upfront-social_media": "../elements/upfront-social-media/js/upfront-social-media",
        "utabs": "../elements/upfront-tabs/js/utabs",
        "this_post": "../elements/upfront-this-post/js/this_post",
        "uwidget": "../elements/upfront-widget/js/uwidget",
        "uyoutube": "../elements/upfront-youtube/js/uyoutube",
        "redactor": "redactor/redactor",
        "ueditor": "redactor/ueditor",
        "upfront_slider": "../elements/upfront-slider/js/uslider"
    },
    shim: {
      'underscore': {
        exports: '_'
      },
      'backbone': {
        deps: ['underscore'],
        exports: 'Backbone'
      }
    },
    // optimize: "none", // in case you want to debug something uncomment this for unoptimized output.
    fileExclusionRegExp: /test/, // exclude ckeeditor from build
    removeCombined: true, // this affects build dir, it makes clearer what is in built main
    findNestedDependencies: true, // we need this since we have nested require calls
    modules: [
      {
        name: "main"
      }
    ]
})
