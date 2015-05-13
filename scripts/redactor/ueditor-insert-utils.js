;(function($){
    define([
            'text!scripts/redactor/ueditor-templates.html'
        ],
        function(tpls){

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

return {
    LinkView: LinkView,
    ImageStylesView: ImageStylesView
};

//End Define
});
})(jQuery);
