(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;
	define([
		'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-post-editor',
		'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-posts',
		'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-draggable-elements',
		'scripts/upfront/upfront-views-editor/sidebar/sidebar-panel-settings'
	], function (SidebarPanel_PostEditor, SidebarPanel_Posts, SidebarPanel_DraggableElements, SidebarPanel_Settings) {

		return Backbone.View.extend({
			"tagName": "ul",
			"className": "sidebar-panels",
			initialize: function () {
				this.init_modules();

				this.listenTo(Upfront.Events, 'click:edit:navigate', this.init_modules);
				// Dev feature only
				//if ( Upfront.Settings.Debug.dev )
				//	this.panels.settings = new SidebarPanel_Settings({"model": this.model});
			},
			init_modules: function (postId) {
				this.panels = {};

				var pluginLayout = Upfront.Application.is_plugin_layout(postId);
				if (pluginLayout && pluginLayout.killPostSettings)
					this.panels.post_editor = new SidebarPanel_PostEditor({'message': pluginLayout.killPostSettings });
				else
					this.panels.post_editor = new SidebarPanel_PostEditor({"model": this.model});

				this.panels.posts = new SidebarPanel_Posts({"model": this.model});
				this.panels.elements = new SidebarPanel_DraggableElements({"model": this.model});
				this.panels.settings = new SidebarPanel_Settings({"model": this.model});

				if (typeof postId !== "undefined") {
					if (postId === false) {
						this.panels = _.omit(this.panels, 'post_editor');
					}
				} else {
					if (typeof _upfront_post_data.post_id === "undefined" || _upfront_post_data.post_id === false) {
						this.panels = _.omit(this.panels, 'post_editor');
					}
				}
			},
			render: function () {
				var me = this;

				me.$el.empty();

				_.each(this.panels, function(panel, index){
					panel.remove();
					panel = me.panels[ index ];
					if(index === "post_editor") {
						// Make sure we re-initialize panels
						panel.initialize();
					}

					panel.render();

					//Render panels to init styles, but do not append to $el
					if ( typeof panel.global_option !== "undefined" && panel.global_option ) {
						if (Upfront.Settings.Application.PERMS.OPTIONS) {
							me.$el.append(panel.el);
						}
					} else {
						if (Upfront.Application.user_can_save_content() && index === 'post_editor') {
							me.$el.append(panel.el);
						} else if (Upfront.Application.user_can_modify_layout()) {
							me.$el.append(panel.el);
						}
					}

					panel.delegateEvents();
				});
			}
		});
	});
}(jQuery));
