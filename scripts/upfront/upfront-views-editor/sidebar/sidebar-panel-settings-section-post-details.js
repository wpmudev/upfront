(function($){
    var l10n = Upfront.Settings && Upfront.Settings.l10n
            ? Upfront.Settings.l10n.global.views
            : Upfront.mainData.l10n.global.views
        ;
    define([
        'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section'
    ], function (SidebarPanel_Settings_Section) {

        return SidebarPanel_Settings_Section.extend({
            initialize: function (opts) {
                this.options = opts;
                this.settings = _([]);
                var self = this;
                
                if ( !Upfront.Views.PostDataEditor ) {
                    require(['content'], function() {
                        if(self.getPostId() !== false) {
                            setTimeout(self.prepare_editor(self));
							// we do not need to initialize_post_data_editor again
                            // self.initialize_post_data_editor();
                        }
                    });
                    return;
                }
                this.initialize_post_data_editor();

            },
            initialize_post_data_editor: function() {
                var self = this;
                this.listenTo(Upfront.Views.PostDataEditor, 'loaded', function(contentEditor) {
                    if ( contentEditor && Upfront.Views.PostDataEditor ) {
						// updating global contentEditor to use the new instance
						Upfront.Views.PostDataEditor.contentEditor = contentEditor;
						Upfront.Views.PostBox = Upfront.Views.PostDataEditor.contentEditor.prepareBox();
                        self.append_box();
                    }
                });

                this.listenTo(Upfront.Views.PostDataEditor, 'post:saved', function() {
                    this.render();
                });
				
                this.stopListening(Upfront.Events, 'click:edit:navigate');
                this.listenTo(Upfront.Events, 'click:edit:navigate', function (postId) {
                    if ( typeof postId !== 'undefined' && postId ) setTimeout(self.prepare_editor(self));
                });

                if (typeof Upfront.Views.PostDataEditor !== "undefined" && Upfront.Views.PostDataEditor.contentEditor !== false) {
                    Upfront.Views.PostBox = Upfront.Views.PostDataEditor.contentEditor.prepareBox();
                }

                if( Upfront.Views.PostDataEditor && Upfront.Views.PostBox ) {
                    self.append_box(Upfront.Views.PostBox);
                }

                this.editor = Upfront.Views.PostDataEditor;

            },
            get_name: function () {
                return 'post_details';
            },
            get_title: function () {
                if ( Upfront.Application.is_single( "post" ) ) {
                    return l10n.post_settings;
                } else if ( Upfront.Application.is_single( "page" ) ) {
                    return l10n.page_settings;
                }
            },

            on_render: function () {
                if( Upfront.Views.PostDataEditor && Upfront.Views.PostBox ) {
                    this.append_box(Upfront.Views.PostBox);
                }
            },

            prepare_editor: function (me) {
                // Post data editor sends out quite a few requests, so if it's already
                // bootstrapped, let's just re-use this if possible
                if(typeof Upfront.Views.PostDataEditor !== "undefined") {
                    if ((Upfront.Views.PostDataEditor || {}).postId === me.getPostId()) {
                        Upfront.Views.PostDataEditor.reboot();
                        return true;
                    }
                }
                // Done, carry on like we did before

                if(typeof Upfront.Views.PostDataEditor !== "undefined") {
                    Upfront.Views.PostDataEditor.remove();
                }

                Upfront.Views.PostDataEditor = new Upfront.Content.PostEditor({
                    editor_id: 'this_post_' + me.getPostId(),
                    post_id: me.getPostId(),
                    content_mode: 'post_content'
                });
                // Upfront.Events.trigger("editor:post_editor:created", Upfront.Views.PostDataEditor);
            },

						getPostId: function() {
							postId = _upfront_post_data.post_id ? _upfront_post_data.post_id : Upfront.Settings.LayoutEditor.newpostType ? 0 : false;
							if (
									!this.postId &&
									true === Upfront.plugins.isRequiredByPlugin('generate fake post id')
							) {
								postId = "fake_post";
							}
							else if (
									!this.postId &&
									true === Upfront.plugins.isRequiredByPlugin('generate fake post id') &&
									Upfront.Application.mode.current === Upfront.Application.MODE.CONTENT_STYLE
							){
								postId = "fake_styled_post";
							}

							return postId;
						},

            append_box: function () {
                var me = this,
                    box = Upfront.Views.PostBox;

                setTimeout(function () {
                    me.$el.empty();
                    me.$el.append(box.$el);
                    box.rebindEvents();
                }, 50);
            },

            /**
             * On cancel handler, do rerender with cached data
             */
            on_cancel: function () {
                if ( ! this.child_view ) return;
                this.child_view.rerender();
            },

            /**
             * On edit start handler, don't cache data on requested rendering
             */
            on_edit_start: function () {
                if ( ! this.child_view ) return;
                this.child_view._do_cache = false;
            },

            /**
             * On edit stop handler, do enable caching back
             */
            on_edit_stop: function () {
                if ( ! this.child_view ) return;
                this.child_view._do_cache = true;
            },

            /**
             * On title change handler, do nothing for now, just for handy reference in case we need it
             * @param {String} title
             */
            on_title_change: function (title) {

            },

            /**
             * On content change handler, do nothing for now, just for handy reference in case we need it
             * @param {String} content
             * @param {Bool} isExcerpt
             */
            on_content_change: function (content, isExcerpt) {

            },

            /**
             * On author change handler, rerender if this is author element
             * @param {Object} authorId
             */
            on_author_change: function (authorId) {
                if ( ! this.child_view ) return;
                var type = this.model.get_property_value_by_name("data_type");
                this.authorId = authorId;
                // Render again if it's author element
                if ( 'author' == type ) {
                    this.child_view.render();
                }
            },

            /**
             * On date change handler, rerender if this is post data element
             * @param {Object} date
             */
            on_date_change: function (date) {
                if ( ! this.child_view ) return;
                var type = this.model.get_property_value_by_name("data_type");
                this.postDate = Upfront.Util.format_date(date, true, true).replace(/\//g, '-');
                // Render again if it's post data element
                if ( 'post_data' == type ) {
                    this.child_view.render(['date_posted']); // Only render the date_posted part
                }
            }
        });

    });
}(jQuery));
