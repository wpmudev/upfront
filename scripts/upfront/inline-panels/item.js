define([], function () {
	var Item = Backbone.View.extend({
		className: 'upfront-inline-panel-item',
		width: 38,
		height: 38,
		icon_class: 'upfront-icon-region',

		initialize: function(options) {
			this.options = options || {};
			this.label = this.options.label;
		},

		render_icon: function () {
			var icon = typeof this.icon === 'function' ? this.icon() : this.icon;
			if ( !icon ) {
				return;
			}
			var me = this,
				icons = icon.split(' '),
				icons_class = ['upfront-icon'],
				$icon = this.$el.find('.upfront-icon');
			_.each(icons, function(each){
				icons_class.push(me.icon_class + '-' + each);
			});
			if ( !$icon.length ) {
				this.$el.append('<i class="' + icons_class.join(' ') + '" />');
			} else {
				$icon.attr('class', icons_class.join(' '));
			}
		},

		render_label: function () {
			var label = typeof this.label === 'function' ? this.label() : this.label;
			if ( !label ) {
				return;
			}
			var $label = this.$el.find('.upfront-inline-panel-item-label');
			this.$el.addClass('labeled');
			if ( !$label.length ) {
				this.$el.append('<span class="upfront-inline-panel-item-label">' + label + '</span>');
			} else {
				$label.html(label);
			}
		},

		render_tooltip: function () {
			var tooltip = typeof this.tooltip === 'function' ? this.tooltip() : this.tooltip;
			if ( ! tooltip ) {
				return;
			}
			this.$el.attr('title', tooltip);
		},

		render: function () {
			this.render_icon();
			this.render_label();
			this.render_tooltip();
			this.$el.css({
				width: this.width,
				height: this.height
			});
			this.$el.attr('id', this.id);
			if ( typeof this.on_render === 'function' ) {
				this.on_render();
			}
		},

		open_modal: function (render_callback, button) {
			if ( ! this.modal ){
				var me = this;
				var $region_container = this.$el.closest('.upfront-region-container');
				this.modal = new Upfront.Views.Editor.Modal({ to: $region_container, top: 60 });
				this.modal.render();
				$region_container.append(this.modal.$el);
			}
			this.listenToOnce(Upfront.Events, 'entity:region:deactivated', function(){
				 me.close_modal(false);
			});
			return this.modal.open(render_callback, this, button);
		},

		close_modal: function (save) {
			return this.modal.close(save);
		},

		remove: function(){
			this.panel_view = false;
		}
	});

	return Item;
});
