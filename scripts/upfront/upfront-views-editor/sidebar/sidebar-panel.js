(function($){
		var l10n = Upfront.Settings && Upfront.Settings.l10n
						? Upfront.Settings.l10n.global.views
						: Upfront.mainData.l10n.global.views
				;
		define([
			'scripts/upfront/upfront-views-editor/mixins',
			'scripts/perfect-scrollbar/perfect-scrollbar'
		], function (Mixins, perfectScrollbar) {
				return Backbone.View.extend(_.extend({}, Mixins.Upfront_Scroll_Mixin, {
						"tagName": "li",
						"className": "sidebar-panel",
						events: {
								"click .sidebar-panel-title": "on_click",
								"click .sidebar-panel-tab" : "show_tab"
						},
						get_title: function () {
								return '';
						},
						render: function () {
								var me = this;
								if(this.active)
										this.$el.addClass('active');
								else
										this.$el.removeClass('active');
								this.$el.html('<h3 class="sidebar-panel-title">' + this.get_title().toUpperCase() + '</h3><div class="sidebar-panel-content" />');

								this.stop_scroll_propagation(this.$el.find('.sidebar-panel-content'));

								if (this.sections) {
									me.$el.find('.sidebar-panel-title').after("<ul class='sidebar-panel-tabspane'></ul>");
									this.sections.each(function (section) {
										section.render();
										me.$el.find('.sidebar-panel-tabspane').append( "<li data-target='" + section.cid +	"' class='sidebar-panel-tab'>" +	section.get_title() +  "</li>");
										me.$el.find('.sidebar-panel-content').append("<div class='sidebar-tab-content' id='" + section.cid +"'></div>");
										me.$el.find(".sidebar-panel-content").find(".sidebar-tab-content").last().html(section.el);


										// Add JS Scrollbar.
										perfectScrollbar.withDebounceUpdate(
											// Element.
											me.$el.find('.sidebar-panel-content')[0],
											// Run First.
											true,
											// Event.
											"entity:object:refresh",
											// Initialize.
											true
										);

									});
								}

								if ( this.on_render ) this.on_render();
								// Make first tab active
								this.$el.find(".sidebar-panel-tab").first().addClass("active");
								// show first tab content
								this.$el.find(".sidebar-tab-content").first().show();
						},
						get_section: function (name) {
								if ( !this.sections )
										return false;
								return this.sections.find(function(section){ return section.get_name() == name; });
						},
						on_click: function () {
								$('.sidebar-panel').not(this.$el).removeClass('expanded');
								this.$el.addClass('expanded');

								// take care of tabs if any
								$('.sidebar-panel').not(this.$el).find(".sidebar-panel-tabspane").hide();
								this.$el.find(".sidebar-panel-tabspane").not(".sidebar-panel-tabspane-hidden").show();

									// Update JS Scrollbar.
									perfectScrollbar.withDebounceUpdate(
										// Element.
										this.$el.find('.sidebar-panel-content')[0],
										// Run First.
										false,
										// Event.
										false,
										// Initialize.
										false
									);
						},
						show_tab : function( e ){
								var tab = "#" + $(e.target).data("target");
								// Set current tab active
								this.$el.find(".sidebar-panel-tab").removeClass("active");
								$(e.target).addClass("active");
								//Show current tab's content
								this.$el.find(".sidebar-tab-content").hide();
								this.$el.find(tab).show();

						}
				}));
		});
}(jQuery));
