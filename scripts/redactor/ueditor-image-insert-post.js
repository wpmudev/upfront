;(function($){
define([
        "scripts/redactor/ueditor-insert",
        "scripts/redactor/ueditor-image-insert-base",
        'text!scripts/redactor/ueditor-templates.html'
    ],
function(Insert, base, tpls){

var PostImageInsert = base.ImageInsertBase.extend({
    className: 'ueditor-insert upfront-inserted_image-wrapper ueditor-insert-variant ueditor-post-image-insert',
    tpl: _.template($(tpls).find('#post-image-insert-tpl').html()),
    shortcode_tpl: _.template($(tpls).find('#post-image-insert-shortcode-tpl').html().replace(/\s+/g," ")),
    //Called just after initialize
    init: function(opts){
        this.controlsData = [
            {id: 'style', type: 'dialog', icon: 'style', tooltip: 'Style', view: this.getStyleView()},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
        ];
        this.createControls();
        this.set_template();

    },
    set_template: function(){
        if( this.is_wp ){
            this.tpl = _.template($(tpls).find('#post-image-insert-wp-tpl').html());
            this.shortcode_tpl = _.template($(tpls).find('#post-image-insert-shortcode-wp-tpl').html().replace(/\s+/g," "));
        }
    },
    // The user want a new insert. Fetch all the required data to create a new image insert
    start: function(){
        var me = this,
            promise = Upfront.Media.Manager.open({multiple_selection: false, insert_options: true})
            ;

        promise.done(function(popup, result){
            me.is_wp = result.at(0).get("insert_option") === "wp_default";
            me.set_template();
            var imageData = me.getImageData(result);
            imageData.id = me.data.id;
            me.data.clear({silent: true});
            imageData.variant_id = imageData.style.vid ? imageData.style.vid : Upfront.Content.ImageVariants.first().get("vid");
            me.data.set(imageData);

        });

        return promise;
    },
    // Insert editor UI
    render: function(){
        var data = this.is_wp ? this.data.toJSON() : this.prepare_data();


        this.$el
            .html(this.tpl(data))
        ;

        this.$shortcode_el = this.is_wp ?  this.$(".post-images-shortcode-wp") : this.$(".post-images-shortcode");

        this.render_shortcode(data);
        this.createControls();
        this.controls.render();
        this.$(".ueditor-insert-variant-group").append(this.controls.$el);
        this.make_caption_editable();
        if(!this.is_wp)
            this.updateControlsPosition();
        this.$(".ueditor-insert-variant-group").append('<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>');

    },
    prepare_data: function(){
        var data = _.extend( {}, this.defaultData, this.data.toJSON() ),
            style_variant = data.style;

        if( !style_variant ) return;
        //data.style = style_variant && style_variant.toJSON ? style_variant.toJSON() : {}; // Force this to be POJ object

        data.style.label_id = data.style.label && data.style.label.trim() !== "" ? "ueditor-image-style-" +  data.style.label.toLowerCase().trim().replace(" ", "-") : data.style.vid;
        data.image = this.get_proper_image();

        if( data.linkType == "show_larger_image" )
            data.linkUrl = data.image.src;

        if( data.show_caption == 0 ){
            data.style.image.width_cls = Upfront.Settings.LayoutEditor.Grid.class + 24;
        }
        var $group = this.$el.find(".ueditor-insert-variant-group"),
            ge = Upfront.Behaviors.GridEditor,
            $parent = $('.upfront-content-marker-contents'),
            padding_left = parseFloat( $(".upfront-content-marker-contents>*").css("padding-left")) / ge.col_size ,
            padding_right = parseFloat( $(".upfront-content-marker-contents>*").css("padding-right")) / ge.col_size,
            parent_col = Upfront.Util.grid.width_to_col( $parent.width(), true ) ,
            max_col =   parent_col  - padding_left - padding_right,
            col_size = $(".upfront-content-marker-contents>*").width()/max_col
            ;


        padding_left = padding_left ? parseInt(padding_left) : 0;
        padding_right = padding_right ? parseInt(padding_right) : 0;

        if (style_variant && style_variant.group && style_variant.group.float) {
            if ( style_variant.group.float == 'left' && padding_left > 0 ){
                data.style.group.marginLeft = ( padding_left - Math.abs(style_variant.group.margin_left) ) * col_size;
                data.style.group.marginRight = 0;
            }
            else if ( style_variant.group.float == 'right' && padding_right > 0 ){
                data.style.group.marginRight = ( padding_right - Math.abs(style_variant.group.margin_right) ) * col_size;
                data.style.group.marginLeft = 0;
            }
            else if ( style_variant.group.float == 'none' && padding_left > 0 ){
                data.style.group.marginLeft = ( padding_left - Math.abs(style_variant.group.margin_left) + Math.abs(style_variant.group.left) ) * col_size;
                data.style.group.marginRight = 0;
            }
        }
        return data;
    },
    render_shortcode: function(data){
        data = data || ( this.is_wp ? this.data.toJSON() : this.prepare_data() );

        var html = this.shortcode_tpl(data);

        //cleanup new lines and unneeded whitespace
        html = html.replace( /\[caption[\s\S]+?\[\/caption\]/g, function( a ) {
            return a.replace( /<br([^>]*)>/g, '<wp-temp-br$1>' ).replace( /[\r\n\t]+/, '' );
        });

        html = html.replace( /\s*<div/g, '\n<div' );
        html = html.replace( /<\/div>\s*/g, '</div>\n' );
        html = html.replace( /\s*\[caption([^\[]+)\[\/caption\]\s*/gi, '\n\n[caption$1[/caption]\n\n' );
        html = html.replace( /caption\]\n\n+\[caption/g, 'caption]\n\n[caption' );
        html = html.replace(/\s+/g," ");
        this.$shortcode_el.html( html );
    },
    //this function is called automatically by UEditorInsert whenever the controls are created or refreshed
    control_events: function(){
        /**
         * Image style from variants
         */
        this.listenTo(this.controls, 'control:ok:style', function(view, control){
            if( view._style ){
                var style = view._style.toJSON();
                this.data.set("variant_id", view.variant_id );
                this.data.set("style", view._style.toJSON());
                view.data.set( "selected", view.variant_id   );
            }
            control.close();
        });

    },

    /**
     * Imports images using caption shortcode
     *
     * @param $contentEl
     * @param insertsData
     * @param inserts
     * @returns {*}
     */
    importFromShortcode: function($contentEl, insertsData, inserts){
        var self = this,
            insert,
            inserts = {};

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
     * @returns {PostImageInsert}
     */
    importFromShortcode_UF: function( shortcode_data ){
        var imageData = _.extend({}, this.defaultData ),
            realSize = this.calculateRealSize( imageData.imageThumb.src )
        ;

        imageData.imageThumb.src = this.get_shortcode_image_src( shortcode_data.content );
        imageData.caption = this.get_shortcode_caption_text( shortcode_data.parse_content );

        imageData = this.populate_link(shortcode_data.content, imageData);

        imageData.imageFull = {
            width: realSize.width,
            height: realSize.height,
            src: imageData.imageThumb.src
        };

        imageData.style = Upfront.Content.ImageVariants.findWhere({ 'vid': shortcode_data.get("uf_variant") }).toJSON();

        imageData.style.caption.show =  shortcode_data.get("uf_show_caption");


        imageData.variant_id = imageData.style.vid;
        var insert = new PostImageInsert({data: imageData, is_wp: false});

        insert.render();
        return insert;

    },

    importFromShortcode_WP: function( shortcode_data ){
        var data = _.extend({}, this.wp_defaults, {
            attachment_id: shortcode_data.get("id").replace("attachment_", ""),
            caption:  this.get_shortcode_caption_text( $.parseHTML( shortcode_data.content ) ),
            link_url: this.get_shortcode_url( shortcode_data.content ),
            image: {
                height: this.get_shortcode_content_image_height( shortcode_data.content ),
                width:  shortcode_data.get("width"),
                src: this.get_shortcode_image_src( shortcode_data.content ),
            },
            style: {
                caption:{
                    show: true
                },
                wrapper: {
                    alignment: shortcode_data.get("align"),
                    width: parseInt( shortcode_data.get("width") ) + 10
                },
                image: {
                    size_class: this.get_shortcode_content_image_size_class( shortcode_data.content )
                }
            }
        } );

        var insert = new PostImageInsert({data: data, is_wp: true});

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
            if( el.innerHtml )
                html += el.innerHtml;

            if( el.textContent )
                html += el.textContent;
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
    //Import from any image tag
    importFromImage: function(image){
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
    PostImageInsert: PostImageInsert
};

//End Define
});
})(jQuery);
