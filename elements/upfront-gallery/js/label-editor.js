(function ($) {
define([
	'text!elements/upfront-gallery/js/templates/label-editor-template.html',
	'text!elements/upfront-gallery/js/templates/label-selector-template.html',
	'text!elements/upfront-gallery/js/templates/labels-template.html',
	'scripts/perfect-scrollbar/perfect-scrollbar'
], function(labelEditorTpl, labelSelectorTpl, labelsTpl, perfectScrollbar) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var LabelEditor = Backbone.View.extend({
		template: _.template(labelEditorTpl),
		labelSelectorTpl: _.template(labelSelectorTpl),

		events: {
			'keyup .labels_filter .uf-labels-filter-field': 'fill_suggestion_list',
			'keydown .labels_filter .uf-labels-filter-field': 'on_field_keydown',
			'click .labels_filter .uf-labels-filter-field': 'on_field_click',
			'click .labels_filter li': 'remove_label',
			'click .ugallery-magnific-addbutton': 'focus_name_field',
			'click .new_labels .toggle-add-label': 'show_add_label',
			'click label': 'on_label_click',
			'click .labels_filter': 'on_field_focus',
			'click .submit-label': 'on_label_add',
			'blur .labels_filter .uf-labels-filter-field': 'on_blur_filter',
			'focus .labels_filter .uf-labels-filter-field': 'on_focus_filter'
		},

		initialize: function(options) {
			this.options = options || {};
			this.gallery = options.gallery;
			this.labels = options.labels;
			this.imageId = options.imageId;
		},
		
		on_field_focus: function(event) {
			// Focus filter input
			this.$el.find('.labels_search input').focus();
		},
		
		on_focus_filter: function(event) {
			var me = this,
				allLabels = _.keys(Upfront.data.ugallery.label_names),
				labels = [];

			_.each(allLabels, function(label){
				var lab = Upfront.data.ugallery.label_names[label];

				if(!_.findWhere(me.labels, { id: lab.id + '' }) && !_.findWhere(me.labels, { id: parseInt(lab.id, 10)})){
					labels.push({
						id: lab.id,
						text: lab.text
					});
				}
			});

			if (labels.length > 0) this.$el.find('.upfront-additive_multiselection').addClass('has_match');
				else this.$el.find('.upfront-additive_multiselection').removeClass('has_match');

			this.$el.find('.labels_list').html(me.labelSelectorTpl({labels: labels, l10n: l10n.template, selection: this.selection}));
			this.labels_list_scrollbar();
		},
		
		labels_list_scrollbar: function() {
			// Add JS Scrollbar.
			perfectScrollbar.withDebounceUpdate(
				// Element. Reference the DOM element instead of the jquery object
				this.$el.find('.labels_list')[0],
				// Run First.
				true,
				// Event.
				false,
				// Initialize.
				true
			);
		},
		
		on_blur_filter: function(event) {
			this.$el.find('.upfront-additive_multiselection').removeClass('has_match');
			return $('.labels_list').html('');
		},
		
		/*?
		 * Prevent crazy click hijack that navigates and reloads the page.
		 */
		on_field_click: function(event) {
			$(event.target).focus();
			event.preventDefault();
			event.stopPropagation();
			return false;
		},

		update_labels: function() {
			this.$el.find('.labels_filter ul').html(_.template(labelsTpl, {labels: this.labels, l10n: l10n.template, selection: this.selection}));
			this.$el.find('.labels_filter ul').append('<li class="labels_search"><input type="text" class="uf-labels-filter-field" style="width:25px;"/></li>');
			if (this.labels.length) {
				this.$el.parents('.inline-panel-control-dialog')
					.siblings('.upfront-icon-region-edit-labels-no-labels')
					.removeClass('upfront-icon-region-edit-labels-no-labels')
					.addClass('upfront-icon-region-edit-labels');
			} else {
				this.$el.parents('.inline-panel-control-dialog')
					.siblings('.upfront-icon-region-edit-labels')
					.removeClass('.upfront-icon-region-edit-labels')
					.addClass('upfront-icon-region-edit-labels-no-labels');
			}
 		},

		render: function() {
			this.$el.html(this.template({
				labels: _.template(labelsTpl, {labels: this.labels, l10n: l10n.template}),
				labelsCount: this.labels.length,
				imageId: this.imageId,
				l10n: l10n.template,
				selection: this.selection
			}));
			
			this.handle_search_field();

			return this;
		},
		
		handle_search_field: function() {
			var $search_field = this.$el.find('.labels_search input'),
				fakeWidth = 25,
				style_block = "position:absolute; left: -1000px; top: -1000px; display:none;",
				div = $('<div />', { 'style': style_block }),
				content = $search_field.val().length > 0 ? $search_field.val() : $search_field.prop("placeholder")
			;
			
			if(this.labels.length > 0) {
				content = $search_field.val();
			}
			
			// Calculate text width
			div.text(content);
			$('body').append(div);
			fakeWidth = div.width() + 20;
			div.remove();
			
			$search_field.width(fakeWidth);
		},
		
		show_add_label: function (e) {
			e.preventDefault();
			e.stopPropagation();
			var $hub = this.$el.find(".new_labels");
			$hub.addClass('active');
		},
	
		focus_name_field: function() {
			var $add_labels = this.$el.find('.ugallery-add_labels');
			if ( $add_labels.val() === '' )
				$add_labels.focus();
			else
				this.add_label($add_labels);
		},
		
		on_label_add: function(e) {
			e.preventDefault();
			e.stopPropagation();

			var	me = this,
				$nameField = this.$el.find('.add-label'),
				label = $.trim($nameField.val())
			;

			if (label.length){
				$nameField.val('').siblings('.labels_list').html('');
				
				$.when(this.gallery.addLabel(label, this.imageId)).done(function(label) {
					me.labels.push(label);
					me.update_labels();
					$nameField.val('');
				});
			}
		},
		
		fill_suggestion_list: function(e) {
			var me = this;

			if([9, 13, 38, 40, 27].indexOf(e.which) !== -1) {
				return;
			}

			var val = $(e.target).val(),
				allLabels = _.keys(Upfront.data.ugallery.label_names),
				labels = [];

			_.each(allLabels, function(label){
				if(label.indexOf(val) !== -1){
					var lab = Upfront.data.ugallery.label_names[label];

					if(!_.findWhere(me.labels, { id: lab.id + '' }) && !_.findWhere(me.labels, { id: parseInt(lab.id, 10)})){
						labels.push({
							id: lab.id,
							text: lab.text.replace(val, '<span class="selection">' + val + '</span>')
						});
					}
				}
			});

			this.handle_search_field();

			if (labels.length > 0) this.$el.find('.upfront-additive_multiselection').addClass('has_match');
				else this.$el.find('.upfront-additive_multiselection').removeClass('has_match');

			this.$el.find('.labels_list').html(me.labelSelectorTpl({labels: labels, l10n: l10n.template, selection: this.selection}));
			this.labels_list_scrollbar();
		},

		select_next_suggestion: function() {
			var selected,
				suggestions,
				currentIdx = -1,
				idx = 0;

			suggestions = this.$el.find('.labels_list li');

			if(!suggestions.length){
				return;
			}

			selected = suggestions.find('label.selected');

			if(selected.length){
				selected.removeClass('selected');
			}

			while(idx < suggestions.length && currentIdx === -1){
				currentIdx = suggestions[idx] === selected.parent()[0] ? idx : -1;
				idx++;
			}

			if(currentIdx === -1) {
				$(suggestions[0]).find('label').addClass('selected');
			} else if(currentIdx < suggestions.length - 1) {
				$(suggestions[currentIdx + 1]).find('label').addClass('selected');
			}
		},

		select_previous_suggestion: function() {
			var selected,
				suggestions,
				currentIdx = -1,
				idx = 0;

			suggestions = this.$el.find('.labels_list li');

			selected = suggestions.find('label.selected');

			if(selected.length){
				selected.removeClass('selected');
			}

			while(idx < suggestions.length && currentIdx === -1){
				currentIdx = suggestions[idx] === selected.parent()[0] ? idx : -1;
				idx++;
			}

			if(currentIdx === -1) {
				$(suggestions[suggestions.length -1]).find('label').addClass('selected');
			} else if(currentIdx > 0) {
				$(suggestions[currentIdx - 1]).find('label').addClass('selected');
			}
		},

		on_field_keydown: function(e) {
			if (_.indexOf([13, 9, 40, 38, 27], e.which) !== -1) {
				e.preventDefault();
			}

			switch (e.which) {
				case 13: // Enter
					this.add_label($(e.target));
					break;
				case 9: // Tab
				case 40: // Down
					this.select_next_suggestion();
					break;
				case 38: // Up
					this.select_previous_suggestion();
					break;
				case 27: // Escape
					this.clear_suggestions();
			}
		},

		clear_suggestions: function() {
			this.$el.find('.labels_list').html('');
		},
		
		on_label_click: function(e){
			var me = this,
				$label = $(e.target).hasClass('selection') ? $(e.target).parent() : $(e.target)
			;

			// Prevent click hijack that reloads the page
			e.preventDefault();
			e.stopPropagation();

			var labelId = $label.attr('rel');
			if (labelId) {
				var label = Upfront.data.ugallery.label_ids[labelId];
				this.gallery.addLabel(label.text, this.imageId);
				$.when(this.gallery.addLabel(label.text, this.imageId)).done(function(label) {
					me.labels.push(label);
					me.update_labels();
					me.$el.find('.labels_list').html('');
					me.$el.find('.filter').val('');
					
					// Hide labels list
					me.$el.find('.upfront-additive_multiselection').removeClass('has_match');
				});
			}
		},

		add_label: function($nameField) {
			var selected = this.$el.find('.labels_list label.selected'),
				me = this,
				label,
				labelId;

			labelId = selected.attr('rel');
			label = Upfront.data.ugallery.label_ids[labelId];

			this.labels.push(label);
			this.update_labels();

			$nameField.val('').siblings('.labels_list').html('');
			this.gallery.addLabel(label.text, this.imageId);
		},

		remove_label: function(e){
			e.preventDefault();

			var $label = $(e.target);
			
			if (!$label.is( "li" )) {
				$label = $label.closest('li');
			}
			
			if($label.hasClass('labels_search')) return;
			
			var	me = this,
				labelId = $label.find('label').data('idx'),
				data,
				label;

			data = {
				action: 'upfront-media-disassociate_label',
				'term': labelId,
				'post_id': this.imageId
			};

			Upfront.Util.post(data);
			label = _.findWhere(this.labels, { id: labelId + ''}) || _.findWhere(this.labels, { id: parseInt(labelId, 10)});
			this.labels = _.without(this.labels, label);

			this.gallery.deleteLabel(labelId, this.imageId);
			
			if(!this.labels.length) this.$el.find('.labels_search input').attr('placeholder', l10n.pick_label);
			
			$label.fadeOut('fast', function(){
				$(this).remove();
				if (me.labels.length === 0) {
					me.update_labels();
				}
			});
		}
	});

	return LabelEditor;
});
})(jQuery);
