;(function($){
    define([
            'text!scripts/redactor/ueditor-templates.html'
        ],
        function(tpls){

var l10n = Upfront.mainData.l10n.global.content;

var ImageStylesView = Backbone.View.extend({
    tpl: _.template($(tpls).find('#image-style-tpl').html()),
    initialize: function( options ){
        this.data = new Backbone.Model();
        this.listenTo(this.data, 'change', this.render);
        this.data.set("variants", BasicImageVariants.toArray() );
        this.data.set( "selected", options.get('variant_id') ? options.get('variant_id') : "center" );

    },
    events: {
        'change input[type=radio]': 'update_data',
        'click input[type=radio]': 'on_click'
    },
    render: function(){
        this.$el.html(this.tpl( { data: this.data.toJSON() } ));
        return this;
    },
    on_click: function(e){
        e.stopPropagation();
    },
    update_data: function(e){
        e.stopPropagation();
        this.variant_id = $(e.target).val();
        this._style = BasicImageVariants.findWhere({vid : this.variant_id});
    }
});

var LinkView = Backbone.View.extend({
    tpl: _.template($(tpls).find('#image-link-tpl').html()),
    initialize: function(opts){
        if(opts.data){
            this.model = new Backbone.Model(opts.data);
            this.listenTo(this.model, 'change', this.render);
        }
    },
    events: {
        'change input[type=radio]': 'updateData'
    },
    render: function(){
        this.$el.width('200px');

        var data = this.model.toJSON();
        data.checked = 'checked="checked"';
        this.$el.html(this.tpl(data));
    },
    updateData: function(e){
        var me = this,
            type = this.$('input:checked').val(),
            url = this.$('#uinsert-image-link-url').val()
            ;
        if(type == 'post'){
            var selectorOptions = {postTypes: this.postTypes()};
            Upfront.Views.Editor.PostSelector.open(selectorOptions).done(function(post){
                me.model.set({linkType: 'post', linkUrl: post.get('permalink')});
            });
        } else {
            this.model.set({linkType: type, linkUrl: url});
        }
    },
    postTypes: function(){
        var types = [];
        _.each(Upfront.data.ugallery.postTypes, function(type){
            if(type.name != 'attachment')
                types.push({name: type.name, label: type.label});
        });
        return types;
    }
});

var PostImageStylesView = Backbone.View.extend({
    initialize: function( options ){
        this.data = new Backbone.Model();
        this.data.set( "variants", Upfront.Content.ImageVariants.toJSON());
        this.data.set( "selected", options.get('variant_id') );
    },
    events: {
        //'change input[type=radio]': 'update_data',
        //'click input[type=radio]': 'on_click'
    },
    prepare_values: function(){
        var self = this,
            values = [];
        _.each(this.data.get("variants"), function(val, index){
            values.push(  { value: val.vid, label: val.label } );
        });
        return values;
    },
    get_default_value: function(){
        return this.data.get("selected");
    },
    render: function(){
        var self = this,
            select = new  Upfront.Views.Editor.Field.Select({
                className: 'upfront-field-wrap upfront-field-wrap-image-style-variant',
                label: l10n.choose_image_insert,
                name: "uf_image_style_variants",
                default_value: this.get_default_value(),
                multiple: false,
                values: this.prepare_values(),
                change: function(variant_id){
                    self._style = Upfront.Content.ImageVariants.findWhere({vid : variant_id});
                    self.data.set( "selected", variant_id );
                }
            });

        select.render();
        this.$el.html( select.$el );
        return this;
    },
    on_click: function(e){
        e.stopPropagation();
    }
});

var WP_PostImageStylesView = Backbone.View.extend({
    className: "upfront-wp-image-style-variants",
    tpl: _.template($(tpls).find('#wp-image-style-tpl').html()),
    get_alignments: function(){
      return [
          { id: "alignone",  label: "No aligment", icon: "upfront-icon-region-style" },
          { id: "alignleft",  label: "Align left", icon: "upfront-icon-region-style" },
          { id: "aligncenter",  label: "Align center", icon: "upfront-icon-region-style" },
          { id: "alignright",  label: "Align right", icon: "upfront-icon-region-style" }
      ];
    },
    initialize: function( options ){
        this.data = new Backbone.Model();
        this.data.set( "variants", this.get_alignments());
        this.listenTo(this.data, 'change', this.render);
        this.data.set( "selected", options.get('variant_id') );
    },
    events: {
        //'change input[type=radio]': 'update_data',
        //'click input[type=radio]': 'on_click'
    },

    get_default_value: function(){
        return this.data.get("selected");
    },
    render: function(){
        this.$el.html( this.tpl( { data: this.data.toJSON() } ) );
        return this;
    },
    on_click: function(e){
        e.stopPropagation();
    }
});

return {
    LinkView: LinkView,
    ImageStylesView: ImageStylesView,
    PostImageStylesView: PostImageStylesView,
    WP_PostImageStylesView: WP_PostImageStylesView
};

//End Define
});
})(jQuery);
