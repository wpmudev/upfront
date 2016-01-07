(function($) {
define([
], function() {
	var BaseModule = Backbone.View.extend({
		initialize: function (opts) {
			var me = this;
			me.options = opts;
			this.fields = opts.fields ? _(opts.fields) : _([]);
			this.on('panel:set', function(){
				me.fields.each(function(field){
					field.panel = me.panel;
					field.trigger('panel:set');
				});
			});
			this.listenForCssOverrides();
		},

		render: function () {
			this.$el.html('');
			if (this.options.title && this.options.toggle !== true) {
				this.$el.append('<div class="upfront-settings-item-title">' + this.options.title + '</div>');
			}
			this.$el.append('<div class="upfront-settings-item-content"></div>');

			var $content = this.$el.find('.upfront-settings-item-content');
			this.fields.each(function(field){
				field.render();
				field.delegateEvents();
				$content.append(field.el);
			});

			if (this.isCssOverridden()) {
				this.showOverriddenOverlay();
			}

			// I don't have time to find where css for this.$el is, so here it goes
			this.$el.css('position', 'relative');
			this.trigger('rendered');
		},

		listenForCssOverrides: function() {
			// Listen to changes of properties and toggle css overridden overlay if needed
			var view = this.options.elementView;
			var selectors = this.options.selectorsForCssCheck;

			// If module is not supposed to listen for overrides don't do this
			if (typeof view === 'undefined' || typeof selectors === 'undefined') return;

			this.listenTo(this.model, 'change', function() {
				if (this.isCssOverridden()) {
					this.showOverriddenOverlay();
				} else {
					this.hideOverriddenOverlay();
				}
			});
		},

		/**
		 * Allow child classes to specify if css is over ridden somewhere in manual css.
		 */
		isCssOverridden: function() {
			return false;
		},

		showOverriddenOverlay: function() {
			if (this.$el.find('.overridden-overlay').length > 0) return;
			this.$el.append('<p class="overridden-overlay" style="display:none">&nbsp;</p>');
		},

		hideOverriddenOverlay: function() {
			this.$el.find('.overridden-overlay').remove();
		},

		save_fields: function () {
			var changed = _([]);
			this.fields.each(function(field, index, list){
				if(field.property){
					var value = field.get_value();
					var saved_value = field.get_saved_value();
					if ( ! field.multiple && value != saved_value ){
						changed.push(field);
					}
					else if ( field.multiple && (value.length != saved_value.length || _.difference(value, saved_value).length !== 0) ) {
						changed.push(field);
					}
				}
			});
			changed.each(function(field, index, list){
				if ( field.use_breakpoint_property )
					field.model.set_breakpoint_property(field.property_name, field.get_value(), true);
				else
					field.property.set({'value': field.get_value()}, {'silent': true});
			});
			if ( changed.size() > 0 )
				this.panel.is_changed = true;
		},

		remove: function(){
			if(this.fields)
				this.fields.each(function(field){
					field.remove();
				});
			Backbone.View.prototype.remove.call(this);
		}
	});

	return BaseModule
});
})(jQuery);
