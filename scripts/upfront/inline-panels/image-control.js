(function ($) {
define([
	'scripts/upfront/inline-panels/control',
	'text!scripts/upfront/inline-panels/templates/panel-control-template.html'
], function (Control, imageControlTemplate) {
	var l10n = Upfront.mainData.l10n.image_element;

	var ImageEditControl = Control.extend({
		multiControl: true,
		hideOnClick: true,
		hideOkButton: true,

		events: {
			'click': 'onClickControl',
			'click button': 'onClickOk'
		},

		initialize: function(options) {
			var me = this;
			this.options = options || {};

			// Allow only one control to be open at a time
			this.listenTo(Upfront.Events, 'image-control:open', function(dialogControl) {
				if (me === dialogControl) {
					return;
				}

				me.close();
			});
		},

		render: function(){
			Control.prototype.render.call(this, arguments);
			var me = this,
				panel;

			if(!this.$el.hasClass('uimage-control-panel-item')) {
				this.$el.addClass('uimage-control-panel-item');
			}
			
			if(this.view){
				this.view.render();
				this.view.delegateEvents();
			}

			if(!this.panel){
				//this is like initialize
				//image-control-dialog-buttons
				this.$el.append('<div class="uimage-control-panel image-control-button"></div>');
				this.$el.find('.image-control-button').append(this.view.$el);
			}

			return this;
		},

		remove: function() {
			$(document).off('click.dialog-control.'+this.cid);
		},

		onDocumentClick: function(e) {
			var	target = $(e.target),
				me = e.data;

			if(target.closest('#page').length && target[0] !== me.el && !target.closest(me.el).length && me.isopen) {
				me.close();
			}
		},

		onClickControl: function(e){
			this.$el.siblings('.upfront-control-dialog-open').removeClass('upfront-control-dialog-open');

			e.preventDefault();

			this.clicked(e);

			if(this.isopen) {
				this.close();
			} else {
				this.open();
			}
		},

		open: function() {
			this.isopen = true;
			this.$el.addClass('upfront-control-dialog-open');
			this.trigger('panel:open');
			Upfront.Events.trigger('dialog-control:open', this);
			return this;
		},
		close: function() {
			this.isopen = false;
			this.$el.removeClass('upfront-control-dialog-open');
			this.trigger('panel:close');
			return this;
		}
	});

	return ImageEditControl;
});
})(jQuery);
