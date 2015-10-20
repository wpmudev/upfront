define([], function() {
	var LinkModel = Backbone.Model.extend({
		defaults: {
			type: 'unlink',
			url: '',
			target: '_self'
		},

		initialize: function() {
			this.on('change:type', this.updateTarget, this);
		},

		updateTarget: function() {
			// Ensure that we do _self for anchors and lightboxes
			if (_.contains(['lightbox', 'anchor'], this.get('type'))) {
				console.log('we have an anchor or a lightbox');
				this.set({'target': '_self'}, {silent: true});
			}
		}
	});

	return LinkModel;
});
