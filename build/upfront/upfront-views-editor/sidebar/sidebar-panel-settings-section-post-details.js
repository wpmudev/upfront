!function(t){var o=Upfront.Settings&&Upfront.Settings.l10n?Upfront.Settings.l10n.global.views:Upfront.mainData.l10n.global.views;define(["scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings-section"],function(t){return t.extend({initialize:function(t){this.options=t,this.settings=_([]);var o=this;return Upfront.Views.PostDataEditor?void this.initialize_post_data_editor():void require(["content"],function(){o.getPostId()!==!1&&(setTimeout(o.prepare_editor(o)),o.initialize_post_data_editor())})},initialize_post_data_editor:function(){var t=this;this.listenTo(Upfront.Views.PostDataEditor,"loaded",function(o){o&&Upfront.Views.PostDataEditor&&(Upfront.Views.PostDataEditor.contentEditor=o,Upfront.Views.PostBox=Upfront.Views.PostDataEditor.contentEditor.prepareBox(),t.append_box())}),this.listenTo(Upfront.Views.PostDataEditor,"post:saved",function(){this.render()}),this.stopListening(Upfront.Events,"click:edit:navigate"),this.listenTo(Upfront.Events,"click:edit:navigate",function(o){"undefined"!=typeof o&&o&&setTimeout(t.prepare_editor(t))}),"undefined"!=typeof Upfront.Views.PostDataEditor&&Upfront.Views.PostDataEditor.contentEditor!==!1&&(Upfront.Views.PostBox=Upfront.Views.PostDataEditor.contentEditor.prepareBox()),Upfront.Views.PostDataEditor&&Upfront.Views.PostBox&&t.append_box(Upfront.Views.PostBox),this.editor=Upfront.Views.PostDataEditor},get_name:function(){return"post_details"},get_title:function(){return Upfront.Application.is_single("page")?o.page_settings:o.post_settings},on_render:function(){Upfront.Views.PostDataEditor&&Upfront.Views.PostBox&&this.append_box(Upfront.Views.PostBox)},prepare_editor:function(t){return"undefined"!=typeof Upfront.Views.PostDataEditor&&(Upfront.Views.PostDataEditor||{}).postId===t.getPostId()?(Upfront.Views.PostDataEditor.reboot(),!0):("undefined"!=typeof Upfront.Views.PostDataEditor&&Upfront.Views.PostDataEditor.remove(),void(Upfront.Views.PostDataEditor=new Upfront.Content.PostEditor({editor_id:"this_post_"+t.getPostId(),post_id:t.getPostId(),content_mode:"post_content"})))},getPostId:function(){return postId=_upfront_post_data.post_id?_upfront_post_data.post_id:!!Upfront.Settings.LayoutEditor.newpostType&&0,this.postId||!0!==Upfront.plugins.isRequiredByPlugin("generate fake post id")?this.postId||!0!==Upfront.plugins.isRequiredByPlugin("generate fake post id")||Upfront.Application.mode.current!==Upfront.Application.MODE.CONTENT_STYLE||(postId="fake_styled_post"):postId="fake_post",postId},append_box:function(){var t=this,o=Upfront.Views.PostBox;setTimeout(function(){t.$el.empty(),t.$el.append(o.$el),o.rebindEvents()},50)},on_cancel:function(){this.child_view&&this.child_view.rerender()},on_edit_start:function(){this.child_view&&(this.child_view._do_cache=!1)},on_edit_stop:function(){this.child_view&&(this.child_view._do_cache=!0)},on_title_change:function(t){},on_content_change:function(t,o){},on_author_change:function(t){if(this.child_view){var o=this.model.get_property_value_by_name("data_type");this.authorId=t,"author"==o&&this.child_view.render()}},on_date_change:function(t){if(this.child_view){var o=this.model.get_property_value_by_name("data_type");this.postDate=Upfront.Util.format_date(t,!0,!0).replace(/\//g,"-"),"post_data"==o&&this.child_view.render(["date_posted"])}}})})}(jQuery);