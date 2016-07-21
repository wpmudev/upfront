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
				bottom: false,
				left: false,
				right: false
			}

			this.listenTo(Upfront.Events, "upfront:paddings:updated", this.refresh);
		},

		onClickControl: function(e){
			var	target = $(e.target);

			if (this.isDisabled) 	return;

			if (!target.closest('.upfront-icon-region-padding').length) {
				e.stopPropagation();
				return;
			}
			
			if (target.hasClass('.upfront-field-checkbox')) {
				return;
			}
			
			e.preventDefault();

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
			
			// Set position of padding container
			this.update_position();

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
				$paddingTopContainer = $('<div class="upfront-padding-container upfront-padding-cotainer-top"></div>'),
				$paddingLockContainer = $('<div class="upfront-padding-container upfront-padding-cotainer-lock"></div>'),
				$paddingLeftContainer = $('<div class="upfront-padding-container upfront-padding-cotainer-left"></div>'),
				$paddingRightContainer = $('<div class="upfront-padding-container upfront-padding-cotainer-right"></div>'),
				$paddingBottomContainer = $('<div class="upfront-padding-container upfront-padding-cotainer-bottom"></div>'),
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
			if(me.default_padding.left === false) {
				me.default_padding.left = column_padding;
			}
			if(me.default_padding.right === false) {
				me.default_padding.right = column_padding;
			}

			me.paddingTop = new Upfront.Views.Editor.Field.Number({
				model: this.model,
				use_breakpoint_property: true,
				property: 'top_padding_num',
				label: '',
				default_value: this.model.get_breakpoint_property_value('top_padding_num') || me.default_padding.top,
				min: 0,
				max: 200,
				step: 5,
				change: function () {
					var value = this.get_value();

					this.model.set_breakpoint_property('use_padding', 'yes', true);
					this.model.set_breakpoint_property('lock_padding', '', true);
					this.model.set_breakpoint_property('top_padding_use', 'yes', true);
					this.model.set_breakpoint_property('top_padding_slider', value, true); // silent, don't need to trigger update again
					this.model.set_breakpoint_property('top_padding_num', value);
					Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
					Upfront.Events.trigger("upfront:paddings:top:updated", this.model, Upfront.data.currentEntity);
				}
			});

			me.paddingLeft = new Upfront.Views.Editor.Field.Number({
				model: this.model,
				use_breakpoint_property: true,
				property: 'left_padding_num',
				label: '',
				default_value: this.model.get_breakpoint_property_value('left_padding_num') || me.default_padding.left,
				min: 0,
				max: 200,
				step: 5,
				change: function () {
					var value = this.get_value();

					this.model.set_breakpoint_property('use_padding', 'yes', true);
					this.model.set_breakpoint_property('lock_padding', '', true);
					this.model.set_breakpoint_property('left_padding_use', 'yes', true);
					this.model.set_breakpoint_property('left_padding_slider', value, true); // silent, don't need to trigger update again
					this.model.set_breakpoint_property('left_padding_num', value);
					Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
					Upfront.Events.trigger("upfront:paddings:left:updated", this.model, Upfront.data.currentEntity);
				}
			});
			
			me.paddingRight = new Upfront.Views.Editor.Field.Number({
				model: this.model,
				use_breakpoint_property: true,
				property: 'right_padding_num',
				label: '',
				default_value: this.model.get_breakpoint_property_value('right_padding_num') || me.default_padding.right,
				min: 0,
				max: 200,
				step: 5,
				change: function () {
					var value = this.get_value();

					this.model.set_breakpoint_property('use_padding', 'yes', true);
					this.model.set_breakpoint_property('lock_padding', '', true);
					this.model.set_breakpoint_property('right_padding_use', 'yes', true);
					this.model.set_breakpoint_property('right_padding_slider', value, true); // silent, don't need to trigger update again
					this.model.set_breakpoint_property('right_padding_num', value);
					Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
					Upfront.Events.trigger("upfront:paddings:right:updated", this.model, Upfront.data.currentEntity);
				}
			});
			
			me.paddingBottom = new Upfront.Views.Editor.Field.Number({
				model: this.model,
				use_breakpoint_property: true,
				property: 'bottom_padding_num',
				label: '',
				default_value: this.model.get_breakpoint_property_value('bottom_padding_num') || me.default_padding.bottom,
				min: 0,
				max: 200,
				step: 5,
				change: function () {
					var value = this.get_value();

					this.model.set_breakpoint_property('use_padding', 'yes', true);
					this.model.set_breakpoint_property('lock_padding', '', true);
					this.model.set_breakpoint_property('bottom_padding_use', 'yes', true);
					this.model.set_breakpoint_property('bottom_padding_slider', value, true); // silent, don't need to trigger update again
					this.model.set_breakpoint_property('bottom_padding_num', value);
					Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
					Upfront.Events.trigger("upfront:paddings:bottom:updated", this.model, Upfront.data.currentEntity);
				}
			});
			
			me.lockPadding = new Upfront.Views.Editor.Field.Checkboxes({
				model: this.model,
				className: 'padding-lock',
				use_breakpoint_property: true,
				property: 'lock_padding',
				label: "",
				default_value: 0,
				multiple: false,
				values: [
					{ label: '', value: 'yes' }
				],
				show: function(value) {
					if(value == "yes") {
						var padding = me.model.get_breakpoint_property_value('top_padding_num');

						me.paddingLeft.$el.find('input').prop( "disabled", true ).css('opacity', 0.4);
						me.paddingRight.$el.find('input').prop( "disabled", true ).css('opacity', 0.4);
						me.paddingBottom.$el.find('input').prop( "disabled", true ).css('opacity', 0.4);

						this.model.set_breakpoint_property('left_padding_num', padding);
						this.model.set_breakpoint_property('top_padding_num', padding);
						this.model.set_breakpoint_property('right_padding_num', padding);
						this.model.set_breakpoint_property('bottom_padding_num', padding);
						me.paddingLeft.get_field().val(padding);
						me.paddingRight.get_field().val(padding);
						me.paddingTop.get_field().val(padding);
						me.paddingBottom.get_field().val(padding);
					} else {
						me.paddingLeft.$el.find('input').prop( "disabled", false ).css('opacity', 1);
						me.paddingRight.$el.find('input').prop( "disabled", false ).css('opacity', 1);
						me.paddingBottom.$el.find('input').prop( "disabled", false ).css('opacity', 1);
						/*
						if(usePadding == "yes") {
							stateSettings.find('.padding-slider').hide();
							stateSettings.find('.padding-number').hide();
							stateSettings.find('.padding-top').show();
							stateSettings.find('.padding-bottom').show();
							stateSettings.find('.padding-left').show();
							stateSettings.find('.padding-right').show();
						}
						*/
					}
				},
				change: function(value) {
					this.model.set_breakpoint_property('lock_padding', value);
					//Upfront.Events.trigger("upfront:paddings:updated", this.model, Upfront.data.currentEntity);
				},

			}),
		
			// Empty padding container
			$paddingControl.html('');
			
			// Append panel title, arrow is not set like pseudo element because we cant update its styles with jQuery
			$paddingControlTitle = '<span class="upfront-padding-arrow"></span><span class="upfront-padding-title">'+ l10n.padding_title +'</span>';
			$paddingControl.append($paddingControlTitle);
			
			// Append padding icons
			$paddingControlTitle = '<span class="upfront-padding-keyboard">&nbsp;</span><span class="upfront-checkbox-info" title="'+ l10n.padding_keyboard +'"></span>';
			$paddingControl.append($paddingControlTitle);

			// Append padding controls
			me.paddingTop.render();
			$paddingTopContainer.append(me.paddingTop.$el);
			$paddingControl.append($paddingTopContainer);
			me.lockPadding.render();
			$paddingLockContainer.append(me.lockPadding.$el);
			me.lockPadding.delegateEvents();
			$paddingControl.append($paddingLockContainer);
			me.paddingLeft.render();
			$paddingLeftContainer.append(me.paddingLeft.$el);
			$paddingControl.append($paddingLeftContainer);
			me.paddingRight.render();
			$paddingRightContainer.append(me.paddingRight.$el);
			$paddingControl.append($paddingRightContainer);
			me.paddingBottom.render();
			$paddingBottomContainer.append(me.paddingBottom.$el);
			$paddingControl.append($paddingBottomContainer);

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
				left_padding_use = this.model.get_breakpoint_property_value('left_padding_use', true),
				right_padding_use = this.model.get_breakpoint_property_value('right_padding_use', true),
				lockPadding = this.model.get_breakpoint_property_value('lock_padding', true),
				lockPaddingField = this.lockPadding.$el.find('input'),
				padding_top_val, padding_bottom_val, padding_left_val, padding_right_val
			;

			if(this.default_padding.top === false) {
				this.default_padding.top = column_padding;
			}
			if(this.default_padding.bottom === false){
				this.default_padding.bottom = column_padding;
			}
			if(this.default_padding.left === false){
				this.default_padding.left = column_padding;
			}
			if(this.default_padding.right === false){
				this.default_padding.right = column_padding;
			}

			padding_top_val = top_padding_use ? this.model.get_breakpoint_property_value('top_padding_num', true) : this.default_padding.top;
			padding_bottom_val = bottom_padding_use ? this.model.get_breakpoint_property_value('bottom_padding_num', true) : this.default_padding.bottom;
			padding_left_val = left_padding_use ? this.model.get_breakpoint_property_value('left_padding_num', true) : this.default_padding.left;
			padding_right_val = right_padding_use ? this.model.get_breakpoint_property_value('right_padding_num', true) : this.default_padding.right;

			lockPadding ? lockPaddingField.attr('checked', 'checked') : lockPaddingField.removeAttr('checked');
			lockPaddingField.trigger('change');

			if(typeof this.paddingTop !== 'undefined') {
				this.paddingTop.get_field().val(padding_top_val);
			}
			if(typeof this.paddingBottom !== 'undefined') {
				this.paddingBottom.get_field().val(padding_bottom_val);
			}
			if(typeof this.paddingLeft !== 'undefined') {
				this.paddingLeft.get_field().val(padding_left_val);
			}
			if(typeof this.paddingRight !== 'undefined') {
				this.paddingRight.get_field().val(padding_right_val);
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
		},
		update_position: function() {
			// Get number of elements before padding
			var elementsNumber = this.$el.prevAll().length,
				leftPosition = elementsNumber * 38;
			
			// Set container position
			this.$el.find('.upfront-padding-control').css('left', -leftPosition);
			
			// Update arrow position under padding button
			this.$el.find('.upfront-padding-arrow').css('left', leftPosition);
		}
	});

	return PaddingControl;
});
})(jQuery);
