(function ($) {
define([
	'scripts/upfront/inline-panels/control',
	'text!scripts/upfront/inline-panels/templates/panel-control-template.html'
], function (Control, panelControlTemplate) {
	var l10n = Upfront.mainData.l10n.image_editor;

	var DialogControl = Control.extend({
		multiControl: true,
		hideOnClick: true,

		events: {
			'click .upfront-icon': 'onClickControl',
			'click button': 'onClickOk'
		},

		initialize: function(options) {
			var me = this;
			this.options = options || {};

			// Allow only one control to be open at a time
			this.listenTo(Upfront.Events, 'dialog-control:open', function(dialogControl) {
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
				panel = $(_.template(panelControlTemplate, {l10n: l10n.template, hideOkButton: this.hideOkButton}));
				panel.addClass('inline-panel-control-dialog');
				panel.addClass('inline-panel-control-dialog-' + this.id);
				this.$el.append(panel);
				panel.find('.uimage-control-panel-content').html('').append(this.view.$el);
				this.panel = panel;
				$(document).on('click.dialog-control.'+me.cid, me, me.onDocumentClick);
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

			if(!$(e.target).closest('.upfront-icon').length || $(e.target).closest('upfront-icon-media-label-delete').length) {
				e.stopPropagation();
				return;
			}

			e.preventDefault();

			this.clicked(e);

			this.$el.siblings('.upfront-control-dialog-open').removeClass('upfront-control-dialog-open');

			if(this.isopen) {
				this.close();
			} else {
				this.open();
			}
		},

		onClickOk: function(e){
			e.preventDefault();
			this.trigger('panel:ok', this.view);
		},

		bindEvents: function(){
			this.panel.find('button').on('click', function(){
			});
		},

		open: function() {
			this.isopen = true;
			this.$el.addClass('upfront-control-dialog-open');
			this.trigger('panel:open');
			Upfront.Events.trigger('dialog-control:open', this);
			
			// add class if last region to allocate clearance for link panel so will not get cut
			if ( this.$el.is('#link') ) {
				var $region = this.$el.closest('.upfront-region-container'),
					$lastRegion = $('.upfront-region-container').not('.upfront-region-container-shadow').last()
				;
				if ( $lastRegion.get(0) == $region.get(0) ) $region.addClass('upfront-last-region-padding');
			}
			
			return this;
		},
		close: function() {
			if ( !this.isopen ) return this; // Not opened, don't need to trigger close
			this.isopen = false;
			this.$el.removeClass('upfront-control-dialog-open');
			this.trigger('panel:close');
			
			// remove class that was previously added on last region
			this.$el.closest('.upfront-region-container').removeClass('upfront-last-region-padding');
			
			return this;
		}
	});

	return DialogControl;
});
})(jQuery);
