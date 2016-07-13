(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function ( Command ) {

       return Command.extend({
            className: "command-new-post",
            postView: false,
            postType: 'post',
            setMode: false,
            initialize: function () {
                this.setMode = Upfront.Application.MODE.CONTENT;
            },
            render: function () {
                Upfront.Events.trigger("command:newpost:start", true);
                // this.$el.addClass('upfront-icon upfront-icon-post');
                this.$el.html(l10n.new_post);
                this.$el.prop("title", l10n.new_post);
            },
            on_click: function (e) {
                e.preventDefault();

                if(Upfront.Settings.LayoutEditor.newpostType == this.postType)
                    return Upfront.Views.Editor.notify(l10n.already_creating_post.replace(/%s/, this.postType), 'warning');

                //return Upfront.Application.navigate('/create_new/post' + location.search, {trigger: true}); // DROP THIS INSANITY
                Upfront.Util
                    .post({
                        action: "upfront-create-post_type",
                        data: _.extend({post_type: this.postType}, {})
                    }).done(function (resp) {
                    //Upfront.Util.log(resp.data);
                    if(_upfront_post_data) _upfront_post_data.post_id = resp.data.post_id;
                    Upfront.Application.navigate('/edit/post/' + resp.data.post_id, {trigger: true});
                    Upfront.Events.trigger("click:edit:navigate", resp.data.post_id);
                })
                ;
            },
            on_post_loaded: function(view) {
                if(!this.postView){
                    this.postView = view;
                    view.editPost(view.post);

                    Upfront.data.currentEntity = view;

                    Upfront.Events.off("elements:this_post:loaded", this.on_post_loaded, this);

                    Upfront.Events.on("upfront:application:contenteditor:render", this.select_title, this);
                }
            },
            select_title: function(){
                var input = this.postView.$('.post_title input').focus();

                input.val(input.val()); //Deselect the text
                $('#upfront-loading').remove();

                Upfront.Events.off("upfront:application:contenteditor:render", this.select_title, this);
            }
        });

    });
}(jQuery));