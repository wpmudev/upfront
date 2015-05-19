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
        this.$editor = opts.$editor;
        this.controlsData = [
            {id: 'style', type: 'dialog', icon: 'style', tooltip: 'Style', view: this.getStyleView()},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
        ];
        this.createControls();
    },
    // Insert editor UI
    render: function(){
        var data = this.prepare_data();


        this.$el
            .html(this.tpl(data))
        ;

        this.$shortcode_el = this.$(".post-images-shortcode");

        this.render_shortcode(data);
        this.createControls();
        this.controls.render();

        var $tools_el = this.$(".ueditor-insert-variant-group");

        $tools_el.append(this.controls.$el);
        this.make_caption_editable();
        this.updateControlsPosition();
        $tools_el.append('<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>');

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

    }

});

var WP_PostImageInsert = base.ImageInsertBase.extend({
    tpl : _.template($(tpls).find('#post-image-insert-wp-tpl').html()),
    shortcode_tpl : _.template($(tpls).find('#post-image-insert-shortcode-wp-tpl').html().replace(/\s+/g," ")),
    init: function(opts){
        this.$editor = opts.$editor;
        this.controlsData = [
            {id: 'style', type: 'dialog', icon: 'style', tooltip: 'Style', view: this.getStyleView()},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
        ];
        this.createControls();

      if( opts.start )
        return this.start( opts.start );
    },
    start: function( result ){
        var me = this,
            imageData = me.getImageData(result);

        imageData.id = me.data.id;
        me.data.clear({silent: true});
        me.data.set(imageData);
        this.render();
        return this;
    },
    getImageData: function(libraryResult){
        if(!libraryResult)
            return false;

        var imagePost = libraryResult.at(0).toJSON(),
            image = this.getSelectedImage(imagePost),
            imageData = $.extend({}, this.wp_defaults, {
                attachment_id: imagePost.ID,
                caption: imagePost.post_excerpt ?  imagePost.post_excerpt : "" ,
                link_url: "",
                image: image,
                style: {
                    caption:{
                        show: true
                    },
                    wrapper: {
                        alignment: "alignnone",
                        width: image.width
                    },
                    image: {
                        size_class: 'size-' + image.selected_size
                    }
                }
            });
        return imageData;
    },
    render: function(){
        var data = this.data.toJSON();


        this.$el
            .html(this.tpl(data))
        ;

        this.$shortcode_el = this.$(".post-images-shortcode-wp");

        this.render_shortcode(data);
        this.createControls();
        this.controls.render();


        var $tools_el = this.$(".wp-caption");
        $tools_el.append(this.controls.$el);
        this.make_caption_editable();
        $tools_el.append('<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>');

    }
});

return {
    PostImageInsert: PostImageInsert,
    WP_PostImageInsert: WP_PostImageInsert
};

//End Define
});
})(jQuery);
