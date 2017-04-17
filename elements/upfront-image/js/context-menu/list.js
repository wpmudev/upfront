define(function() {
	var l10n = Upfront.Settings.l10n.image_element;
	// Context Menu for the Image element
	var ImageMenuList = Upfront.Views.ContextMenuList.extend({
		initialize: function(opts) {
			this.options = opts;
			this.for_view = this.options.for_view;
			var me = this;
			var menuitemsarray = [];
			/* Open Link */
			if (me.for_view.link.get('type') && (me.for_view.link.get('type') === 'external' ? me.for_view.link.get('url') !== "" : true)) {
				menuitemsarray.push( new Upfront.Views.ContextMenuItem({
						get_label: function() {
							var linktype = me.for_view.link.get('type');
							var content_l10n = Upfront.Settings.l10n.global.content;
							if (linktype === 'lightbox')
								return content_l10n.open_lightbox;
							else if (linktype === 'anchor')
								return content_l10n.scroll_to_anchor;
							else if (linktype === 'entry')
								return content_l10n.go_to_post;
							else
								return content_l10n.open_ext_link;
						},
						action: function() {
							Upfront.Util.visitLink(me.for_view.link.get('url'));
						}
					}));
			}
			/* Edit/Add Image */
			menuitemsarray.push( new Upfront.Views.ContextMenuItem({
				get_label: function() {
					if (me.for_view.isThemeImage()) {
						return l10n.ctrl.edit_image;
					}
					if(me.for_view.$el.find('div.upfront-image-container > img').length > 0) {
						return l10n.ctrl.edit_image;
					} else {
						return l10n.ctrl.add_image;
					}
				},
				action: function() {
					if (me.for_view.isThemeImage()) {
						me.for_view.replaceImage();
						return;
					}
					if(me.for_view.$el.find('div.upfront-image-container > img').length > 0) {
						me.for_view.editRequest();
					} else {
						me.for_view.openImageSelector();
					}
				}
			}));

			/* Edit/Add Caption */
			if(this.for_view.$el.find('div.upfront-image-container > img').length > 0) {
				menuitemsarray.push( new Upfront.Views.ContextMenuItem({
						get_label: function() {
							if(me.for_view.$el.find('div.upfront-image-container div.wp-caption').length > 0) {
								return l10n.ctrl.edit_caption;
							} else {
								return l10n.ctrl.add_caption;
							}
						},
						action: function() {
							if(me.for_view.$el.find('div.upfront-image-container > div.wp-caption').length > 0) {
								me.for_view.$el.find('div.upfront-image-container > div.wp-caption').data('ueditor').start();
							} else {
							 me.for_view.controls.items.value()[2].selected='topOver';
							 me.for_view.controls.items.value()[2].trigger('select');

							 me.for_view.property('include_image_caption', [1]);
							 me.for_view.property('caption_position', 'over_image');
							 me.for_view.property('caption_alignment', 'top');
							 me.for_view.render();

							}

						}
					}));
			}

			this.menuitems = _(menuitemsarray);
		}
	});

	return ImageMenuList;
});
