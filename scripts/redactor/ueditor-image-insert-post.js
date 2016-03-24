;(function($){
define([
        "scripts/redactor/ueditor-insert",
        "scripts/redactor/ueditor-image-insert-base",
        'text!scripts/redactor/ueditor-templates.html',
        "scripts/redactor/ueditor-insert-utils"
    ],
function(Insert, base, tpls, utils){
var l10n = Upfront.Settings && Upfront.Settings.l10n
        ? Upfront.Settings.l10n.global.ueditor
        : Upfront.mainData.l10n.global.ueditor
    ;
var PostImageInsert = base.ImageInsertBase.extend({
    className: 'ueditor-insert upfront-inserted_image-wrapper ueditor-insert-variant ueditor-post-image-insert',
    tpl: _.template($(tpls).find('#post-image-insert-tpl').html()),
    shortcode_tpl: _.template($(tpls).find('#post-image-insert-shortcode-tpl').html().replace(/\s+/g," ")),
    //Called just after initialize
    init: function(opts){
        this.$editor = opts.$editor;
        this.controlsData = [
            {id: 'style', type: 'dialog', icon: 'style', tooltip: l10n.style, view: this.getStyleView()},
            {id: 'change_image', type: 'simple', icon: 'change_image', tooltip: l10n.change_image},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: l10n.link_image, view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: l10n.toggle_caption, active: _.bind( this.get_caption_state, this ) }
        ];
        this.createControls();

        if( opts.start )
            return this.start( opts.start );
    },
    start: function( result ){
        var imageData = this.getImageData(result);
        imageData.id = this.data.id;
        imageData.style = this.data.get("style") ||   Upfront.Content.ImageVariants.first().toJSON();
        imageData.variant_id = imageData.style.vid;
        this.data.clear({silent: true});
        this.data.set(imageData, {silent: true});
        this.set_selected_style();
        this.render();
        return this;
    },
    set_selected_style: function(){
        // set selected item in the styles control data
        _.findWhere(this.controlsData, {id : "style"})
            .view.data.set("selected", this.data.get("variant_id") );
    },
    // Insert editor UI
    render: function(){
        var data = this.prepare_data();

        this.$el
            .html(this.tpl(data))
        ;

        this.$shortcode_el = this.$(".post-images-shortcode");

        this.render_shortcode( data );
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
            parent_col = Upfront.Util.grid.width_to_col( $parent.width(), true ),
            max_col =   parent_col  - padding_left - padding_right,
            col_size = $(".upfront-content-marker-contents>*").width()/max_col,
            $object = this.$editor.closest('.upfront-object'),
            object_padding_left = parseInt($object.css('padding-left'), 10),
            object_padding_right = parseInt($object.css('padding-right'), 10)
        ;
        if ( this.$editor.hasClass('upfront-indented_content') ) {
            $parent = this.$editor;
            padding_left = parseFloat( $parent.css("padding-left")) / ge.col_size;
            padding_right = parseFloat( $parent.css("padding-right")) / ge.col_size;
            parent_col = Upfront.Util.grid.width_to_col( $parent.width(), true );
            max_col =   parent_col  - padding_left - padding_right;
            col_size = ge.col_size;
            this.$el.attr('style', 'margin-left: ' + (( padding_left * col_size * -1 ) - object_padding_left) + 'px; margin-right: ' + (( padding_right * col_size * -1 ) - object_padding_right) + 'px;');
        }


        padding_left = padding_left ? parseInt(padding_left, 10) : 0;
        padding_right = padding_right ? parseInt(padding_right, 10) : 0;

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
                this.data.set("variant_id", style.vid );
                this.data.set("style", style);
                view.data.set( "selected", style.vid   );
            }
            control.close();
        });

    }

});

var WP_PostImageInsert = base.ImageInsertBase.extend({
    className:  'ueditor-insert upfront-inserted_image-wrapper upfront-wp-inserted_image-wrapper',
    tpl : _.template( $(tpls).find('#post-image-insert-wp-tpl').html() ),
    shortcode_tpl : _.template( $(tpls).find('#post-image-insert-shortcode-wp-tpl').html() ),
    generate_new_id: function(){
        return 'wpinsert-' + (++Upfront.data.ueditor.insertCount);
    },
    init: function(opts){
        this.$editor = opts.$editor;


      if( opts.start )
        return this.start( opts.start );
    },
    prepare_controls: function(){
        this.controlsData = [
            {id: 'wp_style', type: 'dialog', icon:  _.bind( this.get_style_icon, this ), tooltip: 'Style', view: this.getStyleView(), hideOkButton: true },
            {id: 'change_image', type: 'simple', icon: 'change_image', tooltip: l10n.change_image},
            {id: 'link', type: 'dialog', icon: 'link', tooltip: 'Link image', view: this.getLinkView()},
            {id: 'toggle_caption', type: 'simple', icon: 'caption', tooltip: 'Toggle Caption', active: _.bind( this.get_caption_state, this ) }
        ];
    },
    start: function( result ){
        var me = this,
            imageData = me.getImageData(result);



        imageData.id = me.data.id;
        imageData.variant_id = me.data.get("variant_id") || "alignnone";
        me.data.clear({silent: true});
        me.data.set(imageData, {silent: true});
        this.prepare_controls();
        this.createControls();
        this.render();
        return this;
    },
    getImageData: function(libraryResult){
        if(!libraryResult)
            return false;

        var imagePost = libraryResult.at(0).toJSON(),
            image = this.getSelectedImage(imagePost),
            imageData = _.extend( {}, this.wp_defaults, {
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

        // Set alignment to style
        if( data.variant_id )
            data.style.wrapper.alignment = data.variant_id;

        this.$el
            .html(this.tpl(data))
        ;

        this.$shortcode_el = this.$(".post-images-shortcode-wp");

        this.render_shortcode(data);
        this.prepare_controls();
        this.createControls();
        this.controls.render();


        var $tools_el = this.$(".wp-caption");
        $tools_el.append(this.controls.$el);
        this.make_caption_editable();
        this.updateControlsPosition();
        $tools_el.append('<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>');

    },
    getStyleView: function(){
        if(this.styleView)
            return this.styleView;
        var view = new utils.WP_PostImageStylesView( {model: this.data} );
        this.styleView = view;
        return view;
    },
    get_caption_state: function(){
        if( this.data.get("style").caption.show ){
            return 0
        }else{
            return 1;
        }
    },
    get_style_icon: function(){
      var icon = "wp-style";

        if( this.data && this.data.get('style') )
            icon += ( " " + this.data.get('style').wrapper.alignment );

        return icon;
    },
    controlEvents: function(){
        /**
         * Toggle Caption
         */
        this.listenTo(this.controls, 'control:click:toggle_caption', function(control){
            var new_state = 1,
                style = Upfront.Util.clone( this.data.toJSON().style ); //  cloning to make it trigger the BB model change event
            if( !this.get_caption_state() )
                new_state = 0;

            style.caption.show = new_state;
            this.data.set("style", style);
        });

        this.listenTo(this.controls, 'control:ok:link', function(view, control){
            var type = view.$('input[type=radio]:checked').val() || 'do_nothing',
                url = type === "do_nothing" ? "" :  view.$('input[type=text]').val(),
                link_url = ""
                ;

            //linkData = {
            //    linkType: type,
            //    linkUrl: url
            //};

            if( type == "show_larger_image" )
                url = this.data.get("image").src;

            this.data.set('link_url', url);
            //view.model.set(linkData);
            control.close();
        });

        this.listenTo(this.controls, 'control:click:change_image', this.change_image);

    },
    get_url_type: function( url, image_src ){
        // Create a url parser
        var type = "",
            parsed = document.createElement('a')
            ;

        parsed.href = url;

        if(parsed.origin != window.location.origin)
            type = 'external';

        if(parsed.origin == window.location.origin && image_src != url )
            type = 'post';

        if(parsed.origin == window.location.origin && image_src == url )
            type = 'show_larger_image';


        return type;
    }

});

return {
    PostImageInsert: PostImageInsert,
    WP_PostImageInsert: WP_PostImageInsert
};

//End Define
});
})(jQuery);
