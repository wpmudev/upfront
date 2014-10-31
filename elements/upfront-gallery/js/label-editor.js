(function ($) {
define([
	'text!elements/upfront-gallery/js/templates/label-editor-template.html',
	'text!elements/upfront-gallery/js/templates/label-selector-template.html',
	'text!elements/upfront-gallery/js/templates/labels-template.html'
], function(labelEditorTpl, labelSelectorTpl, labelsTpl) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var LabelEditor = Backbone.View.extend({
		template: _.template(labelEditorTpl),
		labelSelectorTpl: _.template(labelSelectorTpl),

		events: {
			'keyup input[name="ugallery-image-labels"]': 'onImageLabelsKeyup',
			'keydown input[name="ugallery-image-labels"]': 'onImageLabelsKeydown',
			'click label': 'onLabelClick',
			'click .existing_labels a': 'onExistingLabelClick',
			'click .ugallery-magnific-toggle': 'toggle',
			'click .ugallery-magnific-addbutton': 'add'
		},

		initialize: function(options) {
			this.options = options || {};
			this.gallery = options.gallery;
		},

		setupBeforeRender: function(options) {
			this.labels = options.labels;
			this.imageId = options.imageId;
		},

		updateLabels: function(labels) {
			var lightboxLabels = this.$el.find('.ugallery-magnific-wrapper');

			this.labels = labels;

			if(lightboxLabels.length){
				lightboxLabels.find('a').remove();
				lightboxLabels.prepend(_.template(labelsTpl, {labels: labels, l10n: l10n.template}));
			}
		},

		render: function() {
      this.$el.html(this.template({
				labels: _.template(labelsTpl, {labels: this.labels, l10n: l10n.template}),
				imageId: this.imageId,
				l10n: l10n.template
			}));

			return this;
		},

		toggle: function() {
			var panel = this.$el.find('.ugallery-magnific-panel');
			if (panel.hasClass('closed')) {
				this.revealPanel();
			} else {
				panel.css('overflow', 'hidden').addClass('closed');
			}
		},

		add: function() {
			this.$el.find('.ugallery-magnific-addbutton').hide();
			this.$el.find('.ugallery-magnific-addform').show()
				.find('#ugallery-addlabels').focus();
		},

		revealPanel: function() {
			var panel = this.$el.find('.ugallery-magnific-panel');
			panel.removeClass('closed');
			setTimeout(function(){
				panel.css('overflow', 'visible');
			}, 500);
		},

		onImageLabelsKeyup: function(e) {
			var me = this;

			if([9, 13, 38, 40].indexOf(e.which) !== -1) {
				return;
			}

			var val = $(e.target).val(),
			allLabels = _.keys(Upfront.data.ugallery.label_names),
			labels = []
			;

			if(val.length < 2) {
				return $('.labels_list').html('');
			}

			_.each(allLabels, function(label){
				if(label.indexOf(val) !== -1){
					var lab = Upfront.data.ugallery.label_names[label],
					imageLabels = me.gallery.imageLabels[me.imageId]
					;
					if(imageLabels.indexOf('"label_' + lab.id + '"') === -1){
						labels.push({
							id: lab.id,
							text: lab.text.replace(val, '<span class="selection">' + val + '</span>')
						});
					}
				}
			});

			return $('.labels_list').html(me.labelSelectorTpl({labels: labels, l10n: l10n.template}));
		},

		onImageLabelsKeydown: function(e) {
			var me = this;
			var goDown = function(labelsLi){
				var selected = labelsLi.find('label.selected'),
				currentIdx = -1,
				idx = 0;

				if(selected.length){
					selected.removeClass('selected');
				}

				while(idx < labelsLi.length && currentIdx === -1){
					currentIdx = labelsLi[idx] === selected.parent()[0] ? idx : -1;
					idx++;
				}

				if(currentIdx === -1) {
					$(labelsLi[0]).find('label').addClass('selected');
				} else if(currentIdx < labelsLi.length - 1) {
					$(labelsLi[currentIdx + 1]).find('label').addClass('selected');
				}
			};

			var goUp = function(labelsLi){
				var selected = labelsLi.find('label.selected'),
				currentIdx = -1,
				idx = 0;

				if(selected.length){
					selected.removeClass('selected');
				}

				while(idx < labelsLi.length && currentIdx === -1){
					currentIdx = labelsLi[idx] === selected.parent()[0] ? idx : -1;
					idx++;
				}

				if(currentIdx === -1) {
					$(labelsLi[labelsLi.length -1]).find('label').addClass('selected');
				} else if(currentIdx > 0) {
					$(labelsLi[currentIdx - 1]).find('label').addClass('selected');
				}
			};

			var label, labelsLi;
			if(e.which === 13){ // Enter
				e.preventDefault();
				var selected = this.$el.find('.labels_list label.selected');
				if(selected.length){
					var labelId = selected.attr('rel');
					label = Upfront.data.ugallery.label_ids[labelId];

					$(e.target).val('').siblings('.labels_list').html('');
					me.gallery.addLabel(label.text, this.imageId);
				} else{
					label = $.trim($(e.target).val());
					if(label.length){
						$(e.target).val('').siblings('.labels_list').html('');
						me.gallery.addLabel(label, this.imageId);
					}
				}
			} else if(e.which === 9 || e.which === 40){ // Tab or down
				labelsLi = this.$el.find('.labels_list li');
				if(labelsLi.length){
					e.preventDefault();
					goDown(labelsLi);
				}
			} else if(e.which === 38){ // Up
				labelsLi = this.$el.find('.labels_list li');
				if(labelsLi.length){
					e.preventDefault();
					goUp(labelsLi);
				}
			} else if(e.which === 27){ //Esc
				e.preventDefault();
				$(e.target).siblings('.labels_list').html('');
			}
		},

		onLabelClick: function(e){
			var labelId = $(e.target).attr('rel');
			if (labelId) {
				var label = Upfront.data.ugallery.label_ids[labelId];
				this.gallery.addLabel(label.text, this.imageId);
				this.$el.find('input[name="ugallery-image-labels"]').val('').siblings('.labels_list').html('');
			}
		},

		onExistingLabelClick: function(e){
			e.preventDefault();

			var link = $(e.target),
				labelId = link.data('idx'),
				imageLabels = this.gallery.imageLabels[this.imageId].split(', '),
				data,
				me = this;

			data = {
				action: 'upfront-media-disassociate_label',
				'term': labelId,
				'post_id': this.imageId
			};

			Upfront.Util.post(data);

			for(var idx in imageLabels){
				if(imageLabels[idx] && imageLabels[idx] === '"label_' + labelId + '"' ) {
					imageLabels.splice(parseInt(idx, 10), 1);
				}
			}

			this.gallery.imageLabels[this.imageId] = imageLabels.join(', ');

			this.gallery.deleteLabel(labelId, this.imageId);

			$(e.target).fadeOut('fast', function(){
				$(this).remove();
				me.gallery.render();
			});
		}
	});

	return LabelEditor;
});
})(jQuery);
