(function ($) {
define([
	'scripts/upfront/inline-panels/item',
	'scripts/upfront/inline-panels/control'
], function (Item, Control) {
	var l10n = Upfront.mainData.l10n.global.views;

	var PaddingControl = Control.extend({
		multiControl: true,

		events: {
			'click': 'onClickControl'
		},

		initialize: function() {
			var me = this;
			$(document).click(function(e){
				var	target = $(e.target);

				if (target.closest('#page').length && target[0] !== me.el && !target.closest(me.el).length && me.isOpen) {
					me.close();
				}
			});
			$(document).mouseup(function(e){
				var	target = $(e.target),
					currentEntity = Upfront.data.currentEntity;

				if (target.closest('#page').length && target[0] !== me.el && !target.closest(me.el).length && typeof(currentEntity) !== 'undefined' && typeof(currentEntity.padding_hint_locked) !== 'undefined' && currentEntity.padding_hint_locked) {
					currentEntity.padding_hint_locked = false;
					currentEntity.top_padding_hint_timer = setTimeout(function() {
						if(typeof(currentEntity.hide_top_padding_hint) === 'function'){
							currentEntity.hide_top_padding_hint();
						}
					}, 1000);
					currentEntity.bottom_padding_hint_timer = setTimeout(function() {
						if(typeof(currentEntity.hide_bottom_padding_hint) === 'function'){
							currentEntity.hide_bottom_padding_hint();
						}
					}, 1000);
				}
			});

			this.default_padding = {
				top: false,
				bottom: false
			};

			this.listenTo(Upfront.Events, "upfront:paddings:updated", this.refresh);
		},

		onClickControl: function(e){
			var	target = $(e.target);

			if (this.isDisabled) 	return;

			e.preventDefault();

			if (!target.closest('.upfront-icon-region-padding').length) {
				e.stopPropagation();
				return;
			}

			this.clicked(e);

			this.$el.siblings('.upfront-control-dialog-open').removeClass('upfront-control-dialog-open');

			this.listenTo(Upfront.Events, "upfront:hide:paddingPanel", this.close);

			if (this.isOpen) {
				this.close();
			} else {
				this.open();
			}
		},

		open: function() {
			this.isOpen = true;
			this.refresh();
			this.$el.addClass('upfront-control-dialog-open');
			Upfront.Events.trigger('upfront:hide:subControl');
		},

		close: function() {
			this.isOpen = false;
			this.$el.removeClass('upfront-control-dialog-open');
			this.$el.closest('.upfront-inline-panel-item-open').removeClass('upfront-inline-panel-item-open');
		},

		on_render: function() {
			var me = this,
				$paddingControl = me.$('.upfront-padding-control'),
				$paddingTopContainer = $('<div class="upfront-padding-container">' + l10n.top_padding_short + '<span class="upfront-padding-value"></span></div>'),
				$paddingBottomContainer = $('<div class="upfront-padding-container">' + l10n.bottom_padding_short + '<span class="upfront-padding-value"></span></div>'),
				$advancedPaddingContainer = $('<div class="upfront-padding-container"></div>'),
				column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding
			;

			if(!me.$el.hasClass('upfront-padding-control-item')) {
				me.$el.addClass('upfront-padding-control-item');
			}

			if($paddingControl.length === 0){
				$paddingControl = $('<div class="upfront-padding-control inline-panel-control-dialog"></div>');
				me.$el.append($paddingControl);
			}

			if(me.default_padding.top === false) {
				me.default_padding.top = column_padding;
			}
			if(me.default_padding.bottom === false){
				me.default_padding.bottom = column_padding;
			}

			me.paddingTop = new Upfront.Views.Editor.Field.Slider({
				model: this.model,
				use_breakpoint_property: true,
				property: 'top_padding_num',
				label: '',
				default_value: this.model.get_breakpoint_property_value('top_padding_num') || me.default_padding.top,
				min: 0,
				max: 200,
				step: 5,
				valueTextFilter: function (valueText) {
					me.paddingTop.$el.parent('.upfront-padding-container').find('.upfront-padding-value').html(valueText);
					return '';
				},
				change: function () {
					var value = this.get_value();

					this.model.set_breakpoint_property('use_padding', 'yes', true);
					this.model.set_breakpoint_property('lock_padding', '', true);
					this.model.set_breakpoint_property('top_padding_use', 'yes', true);
					this.model.set_breakpoint_property('top_padding_slider', value, true); // silent, don't need to trigger update again
					this.model.set_breakpoint_property('top_padding_num', value);
					Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
					Upfront.Events.trigger("upfront:paddings:top:updated", this.model, Upfront.data.currentEntity);
				},
				callbacks: {
					stop: function (e) {
						var uislider = $(this).data('uiSlider');
						if ( !uislider || !_.isObject(uislider) || !('handle' in uislider) ) return;
						// Call blur on stop to prevent key event handled by jQuery UI Slider
						uislider.handle.blur();
					}
				}
			});

			me.paddingBottom = new Upfront.Views.Editor.Field.Slider({
				model: this.model,
				use_breakpoint_property: true,
				property: 'bottom_padding_num',
				label: '',
				default_value: this.model.get_breakpoint_property_value('bottom_padding_num') || me.default_padding.bottom,
				min: 0,
				max: 200,
				step: 5,
				valueTextFilter: function (valueText) {
					me.paddingBottom.$el.parent('.upfront-padding-container').find('.upfront-padding-value').html(valueText);
					return '';
				},
				change: function () {
					var value = this.get_value();

					this.model.set_breakpoint_property('use_padding', 'yes', true);
					this.model.set_breakpoint_property('lock_padding', '', true);
					this.model.set_breakpoint_property('bottom_padding_use', 'yes', true);
					this.model.set_breakpoint_property('bottom_padding_slider', value, true); // silent, don't need to trigger update again
					this.model.set_breakpoint_property('bottom_padding_num', value);
					Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
					Upfront.Events.trigger("upfront:paddings:bottom:updated", this.model, Upfront.data.currentEntity);
				},
				callbacks: {
					stop: function (e) {
						var uislider = $(this).data('uiSlider');
						if ( !uislider || !_.isObject(uislider) || !('handle' in uislider) ) return;
						// Call blur on stop to prevent key event handled by jQuery UI Slider
						uislider.handle.blur();
					}
				}
			});

			$paddingControl.html('');
			me.paddingTop.render();
			$paddingTopContainer.append(me.paddingTop.$el);
			$paddingControl.append($paddingTopContainer);
			me.paddingBottom.render();
			$paddingBottomContainer.append(me.paddingBottom.$el);
			$paddingControl.append($paddingBottomContainer);

			if ( me.model.attributes.modules === undefined && !me.model.get_property_value_by_name("code_selection_type") ) {

				me.advancedPadding = new Upfront.Views.Editor.Field.Button({
					className: 'upfront-field-wrap upfront-field-wrap-button upfront-field-advanced-padding',
					compact: true,
					label: l10n.advanced_padding,
					name: 'advanced-padding'
				});

				me.advancedPadding.render();
				$advancedPaddingContainer.append(me.advancedPadding.$el);
				$paddingControl.append($advancedPaddingContainer);

			}

			$paddingTopContainer.on('mousedown', function() {
				Upfront.data.currentEntity.padding_hint_locked = true;
			}).on('mouseup', function() {
				var currentEntity = Upfront.data.currentEntity;

				currentEntity.padding_hint_locked = false;
				currentEntity.top_padding_hint_timer = setTimeout(function() {
					if(typeof(currentEntity.hide_top_padding_hint) === 'function'){
						currentEntity.hide_top_padding_hint();
					}
				}, 1000);
			});

			$paddingBottomContainer.on('mousedown', function() {
				Upfront.data.currentEntity.padding_hint_locked = true;
			}).on('mouseup', function() {
				var currentEntity = Upfront.data.currentEntity;

				currentEntity.padding_hint_locked = false;
				currentEntity.bottom_padding_hint_timer = setTimeout(function() {
					if(typeof(currentEntity.hide_bottom_padding_hint) === 'function'){
						currentEntity.hide_bottom_padding_hint();
					}
				}, 1000);
			});
		},

		refresh: function(model) {
			if ( model && model !== this.model ) return;
			var column_padding = Upfront.Settings.LayoutEditor.Grid.column_padding,
				top_padding_use = this.model.get_breakpoint_property_value('top_padding_use', true),
				bottom_padding_use = this.model.get_breakpoint_property_value('bottom_padding_use', true),
				padding_top_val, padding_bottom_val
			;

			if(this.default_padding.top === false) {
				this.default_padding.top = column_padding;
			}
			if(this.default_padding.bottom === false){
				this.default_padding.bottom = column_padding;
			}
			padding_top_val = top_padding_use ? this.model.get_breakpoint_property_value('top_padding_num', true) : this.default_padding.top;
			padding_bottom_val = bottom_padding_use ? this.model.get_breakpoint_property_value('bottom_padding_num', true) : this.default_padding.bottom;


			if(typeof this.paddingTop !== 'undefined') {
				this.paddingTop.get_field().val(padding_top_val);
				if(typeof this.paddingTop.$el.find('#'+this.paddingTop.get_field_id()).slider('instance') !== 'undefined') 	this.paddingTop.$el.find('#'+this.paddingTop.get_field_id()).slider('value', padding_top_val);
				this.paddingTop.$el.parent('.upfront-padding-container').find('.upfront-padding-value').html(padding_top_val);
			}
			if(typeof this.paddingBottom !== 'undefined') {
				this.paddingBottom.get_field().val(padding_bottom_val);
				if(typeof this.paddingBottom.$el.find('#'+this.paddingBottom.get_field_id()).slider('instance') !== 'undefined') 	this.paddingBottom.$el.find('#'+this.paddingBottom.get_field_id()).slider('value', padding_bottom_val);
				this.paddingBottom.$el.parent('.upfront-padding-container').find('.upfront-padding-value').html(padding_bottom_val);
			}
		},
		on_up_arrow_click: function() {
			if(typeof this.paddingTop !== 'undefined') {
				var padding_top_val = parseInt(this.model.get_breakpoint_property_value('top_padding_num', true), 10) - 5;

				padding_top_val = padding_top_val < 0 ? 0 : padding_top_val;

				this.model.set_breakpoint_property('top_padding_use', 'yes');
				this.model.set_breakpoint_property('top_padding_num', padding_top_val);
				this.model.set_breakpoint_property('top_padding_slider', padding_top_val);

				Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
				Upfront.Events.trigger("upfront:paddings:top:updated", this.model, Upfront.data.currentEntity);

				this.refresh();
			}
		},
		on_down_arrow_click: function() {
			if(typeof this.paddingTop !== 'undefined') {
				var padding_top_val = parseInt(this.model.get_breakpoint_property_value('top_padding_num', true), 10) + 5;

				this.model.set_breakpoint_property('top_padding_use', 'yes');
				this.model.set_breakpoint_property('top_padding_num', padding_top_val);
				this.model.set_breakpoint_property('top_padding_slider', padding_top_val);

				Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
				Upfront.Events.trigger("upfront:paddings:top:updated", this.model, Upfront.data.currentEntity);

				this.refresh();
			}
		}
	});

	return PaddingControl;
});
})(jQuery);
