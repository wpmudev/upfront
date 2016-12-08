;(function($){
define([
        "scripts/redactor/ueditor-insert",
        "scripts/redactor/ueditor-image-insert-base",
        'text!scripts/redactor/ueditor-templates.html',
        "scripts/redactor/ueditor-image-insert-post"
    ],
function(Insert, base, tpls, post_inserts){

var PostImageInsert     = post_inserts.PostImageInsert,
    WP_PostImageInsert  = post_inserts.WP_PostImageInsert;

    /**
     * Base class for image inserts and serves as image insert manager
     */
var PostImageInsert_Manager = base.ImageInsertBase.extend({

    /**
     * Adds a new image insert using popup
     *
     * @param InsertManagerInserts $manager_el jquery object
     * @param Ueditor $editor content el jquery object
     * @returns {*}
     */
    start: function($manager_el, $editor){
        var me = this,
            promise = Upfront.Media.Manager.open({multiple_selection: false, insert_options: true}),
            deferred = $.Deferred()
            ;

        promise.done(function(popup, result){
					var insert;
            if(_.isEmpty(  result ) ) return;
            var is_wp = result.at(0).get("insert_option") === "wp_default";
            if( is_wp ) {
                insert = new WP_PostImageInsert({start: result, $editor: $editor});
                deferred.resolve(insert);
            }else{
                insert = new PostImageInsert({start: result, $editor: $editor});
                deferred.resolve(insert);

            }
        });

        return $.when( promise, deferred.promise() );
    },
    /**
     * Imports images using caption shortcode
     *
     * @param $contentEl
     * @param insertsData
     * @param inserts
     * @returns {*}
     */
    importFromShortcode: function($contentEl, insertsData){
        var self = this,
            insert,
            inserts = {};
        // set editor
        this.$editor = $contentEl;

        //lookup caption shortcodes and start parsing them
        var content = wp.shortcode.replace("caption", $contentEl.html(), function( shortcode_data ){

            shortcode_data.parse_content = $.parseHTML( shortcode_data.content );

            if( shortcode_data.get("id").indexOf("uinsert-") !== -1 ){ // if it's a UF caption shortcode
                insert =  self.importFromShortcode_UF( shortcode_data );
            }else{ // it's a wp caption shortcode
                insert = self.importFromShortcode_WP( shortcode_data );
            }

            // add this insert to the pull of inserts
            inserts[insert.data.id] = insert;

            // return insert el's outerHtml to replace the shortcode
            return insert.el.outerHTML;
        });

        $contentEl.html( content );
        return inserts;
    },

    /**
     * Imports from captions shortcode with uf specific id
     *
     * @param shortcode_data
     * @returns {post_inserts.PostImageInsert}
     */
    importFromShortcode_UF: function( shortcode_data ){
        var imageData = _.extend({}, this.defaultData ),
            realSize = this.calculateRealSize( imageData.imageThumb.src)
        ;

        imageData.imageThumb.src = this.get_shortcode_image_src( shortcode_data.content );
        imageData.caption = this.get_shortcode_caption_text( shortcode_data.parse_content );

        imageData = this.populate_link(shortcode_data.content, imageData);

        imageData.imageFull = {
            width: realSize.width,
            height: realSize.height,
            src: imageData.imageThumb.src
        };

        imageData.style = this._findVariant(shortcode_data.get("uf_variant")).toJSON();

        imageData.show_caption = parseInt(shortcode_data.get("uf_show_caption"), 10);
        imageData.style.caption.show =  parseInt(shortcode_data.get("uf_show_caption"), 10);


        imageData.variant_id = imageData.style.vid;
        var insert = new PostImageInsert({data: imageData, $editor: this.$editor});

        insert.render();
        return insert;

    },

    /**
     * Find variant by id
     */
    _findVariant: function (id) {
        var variant = Upfront.Content.ImageVariants.findWhere({ 'vid': id }),
            prev_variant, other_variant
        ;
        if ( variant ) return variant;
        // Fallback logic ported from class_upfront_child_theme.php, see Upfront_ChildTheme::get_image_variant_by_id()

        // Variant not found, search based on previous theme variant
        prev_variant = Upfront.Content.PrevImageVariants.findWhere({ 'vid': id });
        if ( prev_variant ) {
            prev_variant = prev_variant.toJSON();
            // Find matching label on current variant
            variant = Upfront.Content.ImageVariants.findWhere({ 'label': prev_variant.label });
            if ( variant ) return variant;
            // Find matching group float
            variant = Upfront.Content.ImageVariants.find(function(each){
                return ( each.get('group').float == prev_variant.group.float );
            });
            if ( variant ) return variant;
        }

        // Previous theme not found, search based on other theme variant
        other_variant = Upfront.Content.OtherImageVariants.findWhere({ 'vid': id });
        if ( other_variant ) {
            other_variant = other_variant.toJSON();
            // Find matching label on current variant
            variant = Upfront.Content.ImageVariants.findWhere({ 'label': other_variant.label });
            if ( variant ) return variant;
            // Find matching group float
            variant = Upfront.Content.ImageVariants.find(function(each){
                return ( each.get('group').float == other_variant.group.float );
            });
            if ( variant ) return variant;
        }

        // Not so desireable matching from previous theme variant
        if ( prev_variant ) {
            // Find matching image top and left
           /* variant = Upfront.Content.ImageVariants.find(function(each){
               return ( each.get('image').left == prev_variant.image.left && each.get('image').top == prev_variant.image.top );
            });
            if ( variant ) return variant;*/
            // Find matching image order
            variant = Upfront.Content.ImageVariants.find(function(each){
                return ( each.get('image').order == prev_variant.image.order );
            });
            if ( variant ) return variant;
        }

        // Not so desireable matching from other theme variant
        if ( other_variant ) {
            // Find matching image top and left
            /*variant = Upfront.Content.ImageVariants.find(function(each){
                return ( each.get('image').left == other_variant.image.left && each.get('image').top == other_variant.image.top );
            });
            if ( variant ) return variant;*/
            // Find matching image order
            variant = Upfront.Content.ImageVariants.find(function(each){
                return ( each.get('image').order == other_variant.image.order );
            });
            if ( variant ) return variant;
        }

        // Still not found, default to first
        variant = Upfront.Content.ImageVariants.first();

        return variant;
    },

    /**
     * Imports from wp caption short code
     * @param shortcode_data
     * @returns {post_inserts.WP_PostImageInsert}
     */
    importFromShortcode_WP: function( shortcode_data ){
        var data = _.extend( {}, this.wp_defaults, {
            attachment_id: shortcode_data.get("id").replace("attachment_", ""),
            caption:  this.get_shortcode_caption_text( $.parseHTML( shortcode_data.content ) ),
            link_url: this.get_shortcode_url( shortcode_data.content ),
            image: {
                height: this.get_shortcode_content_image_height( shortcode_data.content ),
                width:  shortcode_data.get("width"),
                src: this.get_shortcode_image_src( shortcode_data.content )
            },
            style: {
                caption:{
                    show: parseInt( shortcode_data.get("show_caption"), 10 )
                },
                wrapper: {
                    alignment: shortcode_data.get("align"),
                    width: parseInt( shortcode_data.get("width"), 10 )
                },
                image: {
                    size_class: this.get_shortcode_content_image_size_class( shortcode_data.content )
                }
            }
        } );

        var insert = new WP_PostImageInsert({data: data, $editor: this.$editor });

        insert.render();
        return insert;
    },
    /**
     * Extracts image src from shorcdode's content
     *
     * @param  html content
     * @returns string|bool image src value
     */
    get_shortcode_image_src: function( content ){
        return $("<div>").html(content).find("img").attr("src");
    },

    /**
     * Extracts shortcode caption text from jquery parsed html
     *
     * @param parsed_content jquery parsed html
     * @returns {string}
     */
    get_shortcode_caption_text: function( parsed_content ){
        var html = "";
        _.each(parsed_content, function( el, i ){
            if( !$(el).is("img") )
                html += $("<div>").html(el).html();
            //if( el.innerHtml )
                //html += el.innerHtml;
            //
            //if( el.textContent )
            //    html += el.textContent;
        });

        return html;
    },

    get_shortcode_content_image_size_class: function( content ){
        var regex = /(?:^|\W)size-(\w+)(?!\w)/g,
            $img = $("<div>").html(content).find("img"),
            reg_result = $img.length ? $img.attr("class").match( regex ) : false;
        return reg_result ? reg_result[0] : "";
    },

    get_shortcode_content_image_height: function( content ){
        var $img = $("<div>").html(content).find("img");
        return ($img.length ? $img.attr("height") : "") || "auto";
    },
    /**
     * Populates proper data regarding linking of the image
     *
     * @param content
     * @param imageData
     * @returns {*}
     */
    populate_link: function( content, imageData ){
        imageData.linkUrl = this.get_shortcode_url( content );

        if( !imageData.linkUrl ) return imageData; // if there is no href then there is no link

        // Create a url parser
        var parsed = document.createElement('a');
        parsed.href = imageData.linkUrl;

        if(parsed.origin != window.location.origin)
            imageData.linkType = 'external';

        if(parsed.origin == window.location.origin && imageData.imageThumb.src != imageData.linkUrl )
            imageData.linkType = 'post';

        if(parsed.origin == window.location.origin && imageData.imageThumb.src == imageData.linkUrl )
            imageData.linkType = 'show_larger_image';

        return imageData;
    },
    /**
     * Extracts anchor's href attribute
     * @param content
     * @returns {*}
     */
    get_shortcode_url: function( content ){
        return $("<div>").html(content).find("a").attr("href");
    },
    /**
     * Returns image size class by parsing img tag classes
     *
      * @param img
     * @returns {*}
     */
    get_image_size_class: function( img ){
        var regex = /(?:^|\W)size-(\w+)(?!\w)/g,
            reg_result = img.className ? img.className.match( regex ) : false;
        return reg_result ? reg_result[0] : "";
    },
    /**
     * Returns image attachment id by parsing img tag classes
     * @param img
     * @returns {*}
     */
    get_image_attachment_id: function( img ){
        var regex = /(?:^|\W)wp-image-(\w+)(?!\w)/g,
            reg_result = img.className ? img.className.match( regex ) : false;
        return reg_result ? reg_result[0] : "";
    },
    importFromImage: function( img ){
        var $img = $(img),
             data = _.extend( {}, this.wp_defaults, {
            attachment_id: this.get_image_attachment_id( img ),
            caption: $.trim( "" ||  $img.attr("alt") ),
            link_url: img.src,
            image: {
                height: parseInt( $img.height(), 10 ),
                width:   parseInt( $img.width(), 10 ),
                src:  img.src
            },
            style: {
                caption:{
                    show: false
                },
                wrapper: {
                    alignment: "alignnone",
                    width: parseInt( $img.width(), 10 )
                },
                image: {
                    size_class: this.get_image_size_class( img )
                }
            }
        } );

        var insert = new WP_PostImageInsert({data: data, $editor: this.$editor });

        insert.render();
        $img.replaceWith( insert.$el );
        return insert;
    },
    //Import from any image tag
    importFromImage_prev: function(image){
        //var imageData = Upfront.Util.clone(this.defaultData),
        var imageData = _.extend({}, this.defaultData),
            imageSpecs = {
                src: image.attr('src'),
                width: image.width(),
                height: image.height()
            },
            link = $('<a>').attr('href', imageSpecs.src)[0],
            realSize = this.calculateRealSize(imageSpecs.src),
            $group = image.closest(".ueditor-insert-variant-group"),
            group_classes = $group.attr("class"),
            $caption = $group.find(".wp-caption-text"),
            caption_classes = $caption.attr("class"),
            $image_wrapper = $group.find(".uinsert-image-wrapper"),
            image_wrapper_classes = $image_wrapper.attr("class"),
            caption_order = 1
            ;

        if(link.origin != window.location.origin)
            imageData.isLocal = 0;

        this.calculateRealSize(imageSpecs.src);

        imageData.imageThumb = imageSpecs;
        imageData.imageFull = {
            width: realSize.width,
            height: realSize.height,
            src: imageSpecs.src
        };


        var parent = image.parent();

        if(parent.is('a')){
            imageData.linkUrl = parent.attr('href') ;
            imageData.linkType = 'external';
        }

        var attachmentId = image.attr('class');
        if(!attachmentId)
            imageData.attachmentId = false;
        else {
            attachmentId = attachmentId.match(/wp-image-(\d+)/);
            if(attachmentId)
                imageData.attachmentId = attachmentId[1];
            else
                imageData.attachmentId = false;
        }

        imageData.title = image.attr('title');
        if( !_.isEmpty( $caption.text() ) ){
            imageData.caption =  $caption.html();
        }

        caption_order = $caption.prev( $image_wrapper).length ? 1 : 0;
        if( $caption.length === 0){
            caption_order = 1;
        }
        if(  $group.length ){
            imageData.style = {
                caption: {
                    "order": caption_order,
                    "height": $caption.css("minHeight") ? $caption.css("minHeight").replace("px", "") : $caption.height(),
                    "width_cls": Upfront.Util.grid.derive_column_class( caption_classes ),
                    "left_cls": Upfront.Util.grid.derive_marginleft_class( caption_classes ),
                    "top_cls": Upfront.Util.grid.derive_margintop_class( caption_classes ),
                    "show": $caption.length
                },
                group: {
                    "float": $group.css("float"),
                    "width_cls": Upfront.Util.grid.derive_column_class( group_classes ),
                    "left_cls": Upfront.Util.grid.derive_marginleft_class( group_classes ),
                    "height": $group && $group.css("minHeight") ? $group.css("minHeight").replace("px", "") : imageSpecs.height + $caption.height(),
                    "marginRight": 0,
                    "marginLeft": 0
                },
                image: {
                    "width_cls": Upfront.Util.grid.derive_column_class( image_wrapper_classes ),
                    "left_cls": Upfront.Util.grid.derive_marginleft_class( image_wrapper_classes ),
                    "top_cls": Upfront.Util.grid.derive_margintop_class( image_wrapper_classes ),
                    "src": "",
                    "height": 0
                }
            };
            imageData.variant_id = $group.data("variant");
        }else{
            imageData.style = Upfront.Content.ImageVariants.first().toJSON();
            imageData.variant_id = imageData.style.vid;
        }


        var insert = new PostImageInsert({data: imageData});

        insert.render();
        image.replaceWith(insert.$el);
        return insert;
    }

});

return {
    PostImageInsert_Manager: PostImageInsert_Manager
};

//End Define
});
})(jQuery);
