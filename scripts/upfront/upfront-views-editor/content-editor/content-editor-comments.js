(function($, Backbone){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        "text!upfront/templates/popup.html"
    ], function ( popup_tpl ) {


        return Backbone.View.extend({
            events: {
                "click #upfront-list-meta .upfront-list_item-component": "handle_sort_request",
                "mouseenter .upfront-list_item-comment": "start_reveal_counter",
                "mouseleave .upfront-list_item-comment": "stop_reveal_counter",
                "click .upfront-list_item-comment": "toggle_full_post",
                "click .upfront-comments-approve": "handle_approval_request",
                "click .upfront-comment_actions-wrapper a": "handle_action_bar_request",
                "click .comment-edit-ok": "edit_comment",
                "click .comment-reply-ok": "reply_to_comment",
                "click .comment-reply-cancel": "cancel_edit",
                "click .comment-reply-cancel": "cancel_edit",
                "click .comment-edit-box": "stop_propagation"
            },
            excerptLength: 60,
            commentsTpl: _.template($( popup_tpl ).find('#upfront-comments-tpl').html()),
            commentTpl: _.template($( popup_tpl ).find('#upfront-comment-single-tpl').html()),
            initialize: function(options){
                this.collection.on('change', this.renderComment, this);
                this.collection.on('add', this.addComment, this);
            },

            render: function () {
                //Parse comment meta data
                var comments = this.collection.postId == 0 ? [] : this.collection.getPage(this.collection.pagination.currentPage);
                this.$el.html(
                    this.commentsTpl({
                        comments: comments,
                        excerptLength: 45,
                        commentTpl: this.commentTpl,
                        orderby: this.collection.orderby,
                        order: this.collection.order
                    })
                );
            },

            renderComment: function(comment) {
                this.$('#upfront-list_item-comment-' + comment.get('comment_ID')).html(
                    this.commentTpl({comment: comment, excerptLength: 60})
                );
            },

            addComment: function(comment){
                var parentId = comment.get('comment_parent'),
                    tempId = comment.get('comment_ID'),
                    commentTpl = $('<div class="upfront-list_item-comment upfront-list_item clearfix expanded" id="upfront-list_item-comment-' + tempId + '" data-comment_id="' + tempId + '">' +
                        this.commentTpl({comment: comment, excerptLength: this.excerptLength}) +
                        '</div>').hide()
                    ;
                this.$('div.upfront-list_item-comment').removeClass('expanded');
                this._currently_working = false;

                if(parentId)
                    this.$('#upfront-list_item-comment-' + parentId).after(commentTpl);
                else
                    this.$('div.upfront-list-comment-items').append(commentTpl);
                commentTpl.slideDown();
            },

            handle_sort_request: function (e) {
                var $option = $(e.target).closest('.upfront-list_item-component'),
                    sortby = $option.attr('data-sortby'),
                    order = this.collection.order;
                if(sortby){
                    if(sortby == this.collection.orderby)
                        order = order == 'desc' ? 'asc' : 'desc';
                    this.collection.reSort(sortby, order);
                }
            },

            start_reveal_counter: function (e) {
                var me = this;
                if ($(e.target).is(".upfront-comment-approved") || $(e.target).parents(".upfront-comment-approved").length) return false; // Not expanding on quick reveal
                if (this._currently_working) return false;

                clearTimeout(me._reveal_counter);

                me._reveal_counter = setTimeout(function () {
                    me.reveal_comment(e);
                }, 500);
            },

            reveal_comment: function (e) {
                this.$(".upfront-list-comments .upfront-list_item").removeClass("expanded");
                $(e.currentTarget).addClass("expanded");
                clearTimeout(this._reveal_counter);
            },

            revert_comment: function (e) {
                $(e.currentTarget).removeClass("expanded");
                clearTimeout(this._reveal_counter);
            },

            toggle_full_post: function (e) {
                $(e.currentTarget).toggleClass("expanded");
            },

            stop_reveal_counter: function (e) {
                if (this._currently_working) return false;
                this.revert_comment(e);
            },

            handle_approval_request: function (e, comment) {
                var comment = comment ? comment : this.collection.get($(e.target).attr("data-comment_id"));
                this.$('#upfront-list_item-comment-' + comment.id + ' i.upfront-comments-approve')
                    .animate({'font-size': '1px', opacity:0}, 400, 'swing', function(){
                        comment.approve(true).save();
                    });
            },

            handle_action_bar_request: function (e) {
                var me = this,
                    $el = $(e.currentTarget),
                    comment = this.collection.get($el.parents(".upfront-list_item-comment").attr("data-comment_id"))
                    ;
                if ($el.is(".edit"))
                    this._edit_comment(comment);
                else if ($el.is(".reply"))
                    this._reply_to_comment(comment);
                else if ($el.is(".approve"))
                    this.handle_approval_request(false, comment);
                else if ($el.is(".unapprove"))
                    comment.approve(false).save();
                else if ($el.is(".thrash"))
                    comment.trash(true).save();
                else if ($el.is(".unthrash"))
                    comment.trash(false).save();
                else if ($el.is(".spam"))
                    comment.spam(true).save();
                else if ($el.is(".unspam"))
                    comment.spam(false).save();

                return false;
            },

            edit_comment: function(e){
                var $container = $(e.target).parent(),
                    comment = this.collection.get($container.attr('data-comment_id'))
                    ;

                comment.set('comment_content', $container.find('textarea').attr('disabled', true).val()).save();
            },
            reply_to_comment: function(e){
                var me = this,
                    $container = $(e.target).parent(),
                    comment = this.collection.get($container.attr('data-comment_id')),
                    $comment = this.$('#upfront-list_item-comment-' + comment.get('comment_ID')),
                    text = $container.find('textarea').val(),
                    currentUser = Upfront.data.currentUser
                    ;


                if(text){
                    var reply = new Upfront.Models.Comment({
                            comment_author: currentUser.get('data').display_name,
                            comment_post_ID	: this.collection.postId,
                            comment_parent: comment.get('comment_ID'),
                            comment_content: text,
                            comment_approved: '1',
                            user_id: currentUser.get('ID')
                        }),
                        tempId = (new Date()).getTime()
                        ;

                    $comment.find("textarea").attr('disabled', true);

                    reply.save().done(function(response){
                        me.renderComment(comment);
                        reply.set('comment_ID', response.data.comment_ID);
                        me.collection.add(reply);
                        me.$('#upfront-list_item-comment-' + response.data.comment_ID).hide().slideDown();
                    });
                }
            },

            cancel_edit: function(e) {
                var $container = $(e.target).parent(),
                    comment = this.collection.get($container.attr('data-comment_id'))
                    ;
                this.renderComment(comment);
            },

            stop_propagation: function(e) {
                e.stopPropagation();
            },

            _edit_comment: function (comment) {
                var $comment = this.$('#upfront-list_item-comment-' + comment.get('comment_ID'));

                $comment.find('.upfront-comment_togglable').hide();
                $comment.find('.upfront-comment_edit').show();

                this._currently_working = true;
            },

            _reply_to_comment: function (comment) {
                var $comment = this.$('#upfront-list_item-comment-' + comment.get('comment_ID'));

                $comment.find('.upfront-comment_togglable').show();
                $comment.find('.upfront-comment_edit').hide();

                this._currently_working = true;
            }
        });

    });
}(jQuery, Backbone));