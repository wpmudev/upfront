/*global module, require */
module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-wp-i18n');
	//grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.initConfig({
		sass: {
			options: {
				sourceMap: true,
				outputStyle: 'nested',
				sourceComments: false
			},
			dist: {
				files: {
					'styles/editor-interface.css': 'styles/editor-interface.scss'
				}
			}
		},
		cssmin: {
			//minify: {
			//	src: 'styles/global.css',
			//	dest: 'styles/global.min.css'
			//}
			options: {
				sourceMap: true
			},
			target: {
				files: {
					'styles/global.min.css': ['styles/global.css'],
					'styles/global-rtl.min.css': ['styles/global-rtl.css'],
					'styles/editor-interface.min.css': ['styles/editor-interface.css'],
					'elements/upfront-newnavigation/css/unewnavigation-style.min.css': ['elements/upfront-newnavigation/css/unewnavigation-style.css']
				}
			}
		},
		//uglify: { We don't need this since main.js is already optimized by requirejs optimizer
		//	options: {
		//		mangle: false,
		//		sourceMap: true
		//	},
		//	targets: {
		//		files: {
		//			'build/main.min.js': ['build/main.js']
		//		}
		//	}
		//},
		watch: {
			sass: {
				files: ['**/*.scss'],
				tasks: ['sass'],
				options: {
					spawn: false
				}
			}
		},
		makepot: {
			target: {
				options: {
					domainPath: 'languages/',
					type: 'wp-theme'
				}
			}
		}
	});

	grunt.registerTask('default', ['sass', 'cssmin']);
};