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
    shortcode_tpl: _.template($(tpls).find('#post-image-insert-shortcode-tpl').html()),
    //Called just after initialize
    init: function(){
        this.controlsData = [
            {id: 'style', type: 'dialog', icon: 'style', tooltip: 'Style', view: this.getStyleView()},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
        ];
        this.createControls();
    },
    // The user want a new insert. Fetch all the required data to create a new image insert
    start: function(){
        var me = this,
            promise = Upfront.Media.Manager.open({multiple_selection: false})
            ;

        promise.done(function(popup, result){
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
        var data = this.prepare_data();

        this.$el
            .html(this.tpl(data))
        ;

        this.render_shortcode(data);
        this.createControls();
        this.controls.render();
        this.$(".ueditor-insert-variant-group").append(this.controls.$el);
        this.make_caption_editable();
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
        data = data || this.prepare_data();
        this.$shortcode = this.$(".post-images-shortcode");
        this.$shortcode.html(this.shortcode_tpl(data));
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
            inserts = {};

        var content = wp.shortcode.replace("caption", $contentEl.html(), function( shorcode_data ){

            if( shorcode_data.attrs.named.id.indexOf("uinsert-") !== -1 ){ // if it's a UF caption shortcode
                var insert =  self.importFromShortcode_UF( shorcode_data );

                // add this insert to the pull of inserts
                inserts[insert.data.id] = insert;

                // return insert el's outerHtml to replace the shortcode
                return insert.el.outerHTML;
            }else{ // it's a wp caption shortcode
                return self.importFromShortcode_WP( shorcode_data );
            }

        });

        $contentEl.html( content );
        return inserts;
    },
    importFromShortcode_UF: function( shorcode_data ){
        var imageData = _.extend({}, this.defaultData ),
            realSize = this.calculateRealSize( imageData.imageThumb.src )
        ;

        imageData.imageThumb.src = this.get_image_regex( shorcode_data.content );

        imageData.imageFull = {
            width: realSize.width,
            height: realSize.height,
            src: imageData.imageThumb.src
        };

        imageData.style = Upfront.Content.ImageVariants.findWhere({ 'vid': shorcode_data.attrs.named.uf_variant }).toJSON();
        imageData.variant_id = imageData.style.vid;
        var insert = new PostImageInsert({data: imageData});

        insert.render();
        return insert;

    },
    importFromShortcode_WP: function( shorcode_data ){

    },
    /**
     * Extract iamge src from shorcdode's content
     *
     * @param content
     * @returns string image src value
     */
    get_image_regex: function( content ){
        var regex = new RegExp('\[src] *= *[\"\']{0,1}([^\"\'\ >]*)');
        return content.match( regex )[1];
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
