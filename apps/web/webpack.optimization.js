const path = require('path')
const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

/**
 * Advanced webpack optimization configuration for maximum performance
 */

module.exports = {
  // Production optimizations
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 2
          },
          mangle: {
            safari10: true
          },
          format: {
            comments: false
          }
        },
        extractComments: false,
        parallel: true
      })
    ],

    // Advanced code splitting
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        // Vendor libraries
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true
        },

        // React and related libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
          reuseExistingChunk: true
        },

        // UI libraries
        ui: {
          test: /[\\/]node_modules[\\/](@headlessui|@heroicons|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 15,
          reuseExistingChunk: true
        },

        // PDF processing libraries
        pdf: {
          test: /[\\/]node_modules[\\/](pdf-lib|pdfjs-dist|react-pdf)[\\/]/,
          name: 'pdf',
          chunks: 'all',
          priority: 15,
          reuseExistingChunk: true
        },

        // Workflow and diagram libraries
        workflow: {
          test: /[\\/]node_modules[\\/](reactflow|dagre|d3)[\\/]/,
          name: 'workflow',
          chunks: 'all',
          priority: 15,
          reuseExistingChunk: true
        },

        // Common utilities
        utils: {
          test: /[\\/]node_modules[\\/](lodash|date-fns|axios)[\\/]/,
          name: 'utils',
          chunks: 'all',
          priority: 12,
          reuseExistingChunk: true
        },

        // Application common code
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          enforce: true
        }
      }
    },

    // Runtime chunk optimization
    runtimeChunk: {
      name: 'runtime'
    },

    // Module concatenation
    concatenateModules: true,

    // Side effects optimization
    sideEffects: false,

    // Tree shaking
    usedExports: true,
    providedExports: true
  },

  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
    assetFilter: (assetFilename) => {
      return !assetFilename.endsWith('.map')
    }
  },

  // Resolve optimizations
  resolve: {
    // Module resolution optimization
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],

    // Extension resolution order
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],

    // Alias for faster resolution
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets')
    },

    // Fallback for Node.js modules in browser
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "buffer": require.resolve("buffer"),
      "process": require.resolve("process/browser")
    }
  },

  // Module rules optimization
  module: {
    rules: [
      // TypeScript/JavaScript optimization
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
                  },
                  modules: false,
                  useBuiltIns: 'usage',
                  corejs: 3
                }],
                '@babel/preset-react',
                '@babel/preset-typescript'
              ],
              plugins: [
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-syntax-dynamic-import',
                ['@babel/plugin-transform-runtime', {
                  regenerator: true
                }]
              ],
              cacheDirectory: true,
              cacheCompression: false
            }
          }
        ]
      },

      // CSS optimization
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[name]__[local]--[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                  require('cssnano')({
                    preset: 'default'
                  })
                ]
              }
            }
          }
        ]
      },

      // Image optimization
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8192 // 8kb
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 85
              },
              optipng: {
                enabled: false
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              },
              gifsicle: {
                interlaced: false
              },
              webp: {
                quality: 85
              }
            }
          }
        ]
      },

      // Font optimization
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]'
        }
      }
    ]
  },

  // Plugins for optimization
  plugins: [
    // Clean dist folder
    new CleanWebpackPlugin(),

    // Define environment variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      '__DEV__': process.env.NODE_ENV !== 'production'
    }),

    // Provide polyfills
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    }),

    // Compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    }),

    // Brotli compression
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: {
        level: 11
      },
      threshold: 8192,
      minRatio: 0.8
    }),

    // Bundle analyzer (only in analyze mode)
    ...(process.env.ANALYZE ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html'
      })
    ] : []),

    // Module federation for micro-frontends (if needed)
    new webpack.container.ModuleFederationPlugin({
      name: 'docuslicer',
      filename: 'remoteEntry.js',
      exposes: {
        './WorkflowBuilder': './src/components/workflow/WorkflowBuilder',
        './DocumentViewer': './src/components/documents/DocumentViewer',
        './PDFEditor': './src/components/editor/AdvancedPDFEditor'
      },
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0'
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0'
        }
      }
    })
  ],

  // Cache configuration
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    },
    cacheDirectory: path.resolve(__dirname, '.webpack-cache')
  },

  // Experiments
  experiments: {
    topLevelAwait: true,
    outputModule: true
  },

  // Stats configuration
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
    entrypoints: false,
    excludeAssets: /\.(map|txt|html|jpg|png|svg)$/
  }
}

// Development-specific optimizations
if (process.env.NODE_ENV === 'development') {
  module.exports.optimization.minimize = false
  module.exports.optimization.splitChunks = {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all'
      }
    }
  }
  
  // Hot module replacement
  module.exports.plugins.push(
    new webpack.HotModuleReplacementPlugin()
  )
}

// Production-specific optimizations
if (process.env.NODE_ENV === 'production') {
  // Additional production plugins
  module.exports.plugins.push(
    // Ignore moment.js locales to reduce bundle size
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/
    }),

    // Optimize CSS
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 50
    })
  )
}
