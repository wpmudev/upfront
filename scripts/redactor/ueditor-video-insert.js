;(function($){
	define([
			"scripts/redactor/ueditor-insert",
			'scripts/upfront/video-selector'
	],
	function(Insert, VideoSelector) {
		var l10n = Upfront.Settings && Upfront.Settings.l10n ?
			Upfront.Settings.l10n.global.ueditor
			: Upfront.mainData.l10n.global.ueditor
		;

		var VideoInsert = Insert.UeditorInsert.extend({
			type: 'video',

			// Allows controls to remain open when view is re-rendered
			controlsOpen: false,

			defaults: {
				'mute': false,
				'controls': true,
				'loop': false,
				'autoplay': false
			},

			events:{
				'click .video-insert-controls': 'toggleVideoControls',
				'click .swap-video-insert-button': 'swapVideo',
				'click .video-insert-toggle-mute': 'toggleMute',
				'click .video-insert-toggle-controls': 'toggleControls',
				'click .video-insert-toggle-loop': 'toggleLoop',
				'click .video-insert-toggle-autoplay': 'toggleAutoplay',
				'click .ueditor-insert-remove': 'removeInsert'
			},

			getSimpleOutput: function () {
				var $embed = $(this.data.get('video_embed'));
				if (this.data.get('mute') === true) {
					$embed.attr('muted', true);
				} else {
					$embed.removeAttr('muted');
				}
				if (this.data.get('controls') === true) {
					$embed.attr('controls', 'controls');
				} else {
					$embed.removeAttr('controls');
				}
				if (this.data.get('autoplay') === true) {
					$embed.attr('data-autoplay-video', true);
				} else {
					$embed.removeAttr('data-autoplay-video');
				}
				if (this.data.get('loop') === true) {
					$embed.attr('loop', true);
				} else {
					$embed.removeAttr('loop');
				}

				var out = $('<div><div class="uinsert-video-insert">' + $('<div/>').append($embed).html() + '</div></div>');
				return  out.html();
			},

			getOutput: function() {
				return  this.getSimpleOutput();
			},

			start: function($el) {
				var deferred = new $.Deferred();

				this.$editor = $el.closest(".redactor-box");
				this.data.set(this.defaults, {silent: true});

				this.selectVideo(deferred);

				return deferred;
			},

			/**
			 * Proxy for selectVideo that ensures it will be called without arguments.
			 */
			swapVideo: function() {
				this.selectVideo();
			},

			/**
			 * Starts video selector and updates model with results.
			 */
			selectVideo: function(deferred) {
				var videoSelector = new VideoSelector(),
					me = this;

				Upfront.preventRedactorStopOnOutsideClick = true;

				videoSelector.open({multiple_selection: false })
					.done(function(videoData){
						videoSelector.close();

						me.data.set({
							'video_embed': me.getEmbedFromVideoData(videoData),
							//'id': videoData.id // @TODO: this data.id is used by InsertManager, but in the form of uinsert-*
						});

						if (deferred) {
							deferred.resolve(me, videoData.embed);
						}

						Upfront.preventRedactorStopOnOutsideClick = false;
					});
			},

			/**
			 * Creates embed html from uploaded video data.
			 */
			getEmbedFromVideoData: function(videoData) {
				// Fit video to parent
				var width;
				if (this.$editor.children('.upfront-indented_content').length > 0) {
					width = parseInt(this.$editor.children('.upfront-indented_content').width(), 10);
				}
				else {
					width = parseInt(this.$editor.width(), 10);
				}

				var embed = $(videoData.embed).find('video')
					.attr('preload', 'none') // Prevent video from preloading in editor,
																	// it causes too much requests and they block
																	// communication with server. Default is 'auto'
					.attr('width', width)
					.attr('height', Math.round(width / videoData.aspect))
					.attr('data-cover-url', videoData.cover) // Since we don't load video, setup cover image
					.attr('data-aspect', videoData.aspect) // For future use
					.attr('controls', 'controls'); // Shown by default

				return $('<div/>').append(embed).html(); // Return the html string for saving
			},

			toggleVideoControls: function(event) {
				if (false === $(event.target).hasClass('video-insert-controls')) return;
				this.controlsOpen = !this.controlsOpen;
				this.$el.find('.video-insert-controls-panel').toggle();
				if (this.$el.find('.video-insert-controls').hasClass('video-insert-controls-expanded')) {
					this.$el.find('.video-insert-controls').removeClass('video-insert-controls-expanded');
				} else {
					this.$el.find('.video-insert-controls').addClass('video-insert-controls-expanded');
				}
			},

			// Insert editor UI
			render: function(){
				var me = this;
				this.$el.addClass('uinsert-video-insert');
				var $embed = $(this.data.get('video_embed'));
				if (this.data.get('mute') === true) {
					$embed.attr('muted', true);
				} else {
					$embed.removeAttr('muted');
				}
				if (this.data.get('controls') === true) {
					$embed.attr('controls', 'controls');
				} else {
					$embed.removeAttr('controls');
				}
				if (this.data.get('autoplay') === true) {
					$embed.attr('data-autoplay-video', true);
				} else {
					$embed.removeAttr('data-autoplay-video');
				}
				if (this.data.get('loop') === true) {
					$embed.attr('loop', true);
				} else {
					$embed.removeAttr('loop');
				}
				this.$el.html($embed);

				// Add cover image since we do not preload video, far better than empty space
				$embed.css('background-image', 'url(' + $embed.attr('data-cover-url') + ')')
					.css('background-size', 'cover');

				this.$el.css('position', 'relative');
				var controls = $('<div class="video-insert-controls">' +
						'<div class="video-insert-controls-panel">' +
						'<div class="image-crop-edit-button image-edit-col-full" title="Swap Video"><input type="button" class="swap-video-insert-button upfront-field upfront-field-button" value="Swap Video" placeholder="Swap Video"></div>' +

						'<div><span>Mute:</span><div class="upfront_toggle"><input ' + (this.data.get('mute') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-mute"> <label class="upfront_toggle_label video-insert-toggle-mute"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'<div><span>Autoplay</span><div class="upfront_toggle"><input ' + (this.data.get('autoplay') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-autoplay"> <label class="upfront_toggle_label video-insert-toggle-autoplay"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'<div><span>Loop</span><div class="upfront_toggle"><input ' + (this.data.get('loop') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-loop"> <label class="upfront_toggle_label video-insert-toggle-loop"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'<div><span>Controls</span><div class="upfront_toggle"><input ' + (this.data.get('controls') ? 'checked' : '') + ' type="checkbox" class="upfront_toggle_checkbox video-insert-toggle-checkbox-controls"> <label class="upfront_toggle_label video-insert-toggle-controls"> <span class="upfront_toggle_inner"></span> <span class="upfront_toggle_switch"></span></label></div></div>' +
						'</div>' +
						'</div>' +
						'<a href="#" contenteditable="false" class="upfront-icon-button upfront-icon-button-delete ueditor-insert-remove"></a>'
					);
				this.$el.append(controls);
				if (this.controlsOpen) {
					this.$el.find('.video-insert-controls').addClass('video-insert-controls-expanded');
					this.$el.find('.video-insert-controls-panel').toggle();
				}
				// Unwrap from parent `p` since it causes video first added to not be simple output
				// on first redactor exit (also messes up styling)
				if (this.$el.parent().is('p')) {
					this.$el.unwrap();
				}
			},
			toggleMute: function() {
				if (this.data.get('mute') === true) {
					this.data.set('mute', false);
					this.$el.find('.video-insert-toggle-checkbox-mute').removeAttr('checked');
				} else {
					this.data.set('mute', true);
					this.$el.find('.video-insert-toggle-checkbox-mute').attr('checked', 'checked');
				}
			},
			toggleLoop: function() {
				if (this.data.get('loop') === true) {
					this.data.set('loop', false);
					this.$el.find('.video-insert-toggle-checkbox-loop').removeAttr('checked');
				} else {
					this.data.set('loop', true);
					this.$el.find('.video-insert-toggle-checkbox-loop').attr('checked', 'checked');
				}
			},
			toggleAutoplay: function() {
				if (this.data.get('autoplay') === true) {
					this.data.set('autoplay', false);
					this.$el.find('.video-insert-toggle-checkbox-autoplay').removeAttr('checked');
				} else {
					this.data.set('autoplay', true);
					this.$el.find('.video-insert-toggle-checkbox-autoplay').attr('checked', 'checked');
				}
			},
			toggleControls: function() {
				if (this.data.get('controls') === true) {
					this.data.set('controls', false);
					this.$el.find('.video-insert-toggle-checkbox-controls').removeAttr('checked');
				} else {
					this.data.set('controls', true);
					this.$el.find('.video-insert-toggle-checkbox-controls').attr('checked', 'checked');
				}
			},

			importInserts: function(contentElement, insertsData){
				var inserts = {};
				contentElement.find('.uinsert-video-insert').each(function () {
					var $videoInsert = $(this),
						insert,
						$video = $videoInsert.find('video'),
						data = {}
					;

					data.video_embed = $('<div/>').append($video).html();
					data.controls = !! $video.attr('controls');
					data.autoplay = !! $video.attr('data-autoplay-video');
					data.loop = !! $video.attr('loop');
					data.mute = !! $video.attr('muted');

					insert = new VideoInsert({data: data});
					inserts[insert.data.id] = insert;
					insert.render();
					$videoInsert.replaceWith(insert.$el);
				});
				return inserts;
			},

			removeInsert: function(e) {
				e.preventDefault();
				this.trigger('remove', this);
			}
		});

		return {
			VideoInsert: VideoInsert
		};
	});
})(jQuery);
