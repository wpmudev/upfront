(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/commands/command'
    ], function (Command) {

        return Command.extend({
            tagName: "div",
            className: "upfront-sidebar-content_editor-sidebar_command",
            post: false,
            initialize: function(){
                this.setPost();
                Upfront.Events.on("data:current_post:change", this.setPost, this);
            },
            setPost: function(){
                var currentPost = Upfront.data.currentPost;

                if(!currentPost)
                    this.post = new Upfront.Models.Post({post_type: 'post', id: '0'});
                else if(!this.post || this.post.id !=  currentPost.id){
                    this.post = Upfront.data.currentPost;
                    if(this.onPostChange)
                        this.onPostChange();
                }

                return this;
            }
        });

    });
}(jQuery));