# Changelog

## [3.3.6](https://github.com/Project-Colony/SphereCord/compare/v3.3.5...v3.3.6) (2026-11-02)


### Bug Fixes

* **deps:** sync Equibop upstream through Electron 44.9.3 ([9bb749c](https://github.com/Project-Colony/SphereCord/commit/9bb749cf8e5a4f74221e9e5e7456fe676e98b6d8))
* **spellcheck:** don't crash the language menu before Discord loads its search control ([e943a62](https://github.com/Project-Colony/SphereCord/commit/e943a626feb1f22b8fb58b033f613d93a0fb7fdc))
* **spellcheck:** load each regional dictionary once ([25af94d](https://github.com/Project-Colony/SphereCord/commit/25af94dd67645d13d28d348f99d58c4b3e54d71d))
* **splash:** let the progress bar reach 100% ([c68cb60](https://github.com/Project-Colony/SphereCord/commit/c68cb60fe4ce94fe3cad9d1f860366c65af0197c))


### Performance Improvements

* **arrpc:** keep only the database fields arrpc-bun reads ([90ca8bb](https://github.com/Project-Colony/SphereCord/commit/90ca8bbf42a62a6d74176fee7472d88e63354cfd))
* **renderer:** resolve the platform once ([c08169f](https://github.com/Project-Colony/SphereCord/commit/c08169f782fb806d8d9d6a3c56da618a7ab439c0))
* **window:** debounce window bounds persistence ([72c2946](https://github.com/Project-Colony/SphereCord/commit/72c2946e671aa7500bf527d8826415999384bafe))

## [3.3.5](https://github.com/Project-Colony/SphereCord/compare/v3.3.4...v3.3.5) (2026-10-03)


### Bug Fixes

* **tray:** use SphereCord artwork for every status icon ([d241e3d](https://github.com/Project-Colony/SphereCord/commit/d241e3d386df67c12bf835d563ac9d8da832b7ef))

## [3.3.4](https://github.com/Project-Colony/SphereCord/compare/v3.3.3...v3.3.4) (2026-10-03)


### Bug Fixes

* **package:** `toolset` -&gt; `toolsets` ([#1333](https://github.com/Project-Colony/SphereCord/issues/1333)) ([303e8c0](https://github.com/Project-Colony/SphereCord/commit/303e8c03ce7a65cf3dcccbb9f298119aa085711d))

## [3.3.3](https://github.com/Project-Colony/SphereCord/compare/v3.3.2...v3.3.3) (2026-07-29)


### Bug Fixes

* **build:** don't fail packaging for targets arRPC can't be built for ([34b1ea3](https://github.com/Project-Colony/SphereCord/commit/34b1ea3a3650673669d335801d59e176cfd6316d))

## [3.3.2](https://github.com/Project-Colony/SphereCord/compare/v3.3.1...v3.3.2) (2026-07-29)


### Performance Improvements

* cut the install by a third and the arRPC startup peak by 100 MB ([a36b48c](https://github.com/Project-Colony/SphereCord/commit/a36b48c7172c6c0e1730a5fbf47f9355695e1ddc))

## [3.3.1](https://github.com/Project-Colony/SphereCord/compare/v3.3.0...v3.3.1) (2026-07-25)


### Bug Fixes

* **ci:** pass -R when uploading signatures so releases ship signed ([ba55762](https://github.com/Project-Colony/SphereCord/commit/ba557629b07c47209f4e25658e276f0b8c2e0944))

## [3.3.0](https://github.com/Project-Colony/SphereCord/compare/v3.2.7...v3.3.0) (2026-07-25)


### Features

* **ci:** sign release assets with the Project-Colony org key ([57a77b2](https://github.com/Project-Colony/SphereCord/commit/57a77b2ab7cddbd7d51d029052fc602347fb00bc))
* colony.json manifest - list SphereCord in the Colony store (Linux AppImage) ([c24ca7f](https://github.com/Project-Colony/SphereCord/commit/c24ca7f002f2156a224d5971af64b3c35b69237d))
* declare signed releases in the manifest ([585fa35](https://github.com/Project-Colony/SphereCord/commit/585fa35ecbf587221dadb29af64219da211cb38d))
* **themes:** colour swatches on the bundled theme cards ([da08f75](https://github.com/Project-Colony/SphereCord/commit/da08f75349697d5826ad450125904e4630d54f0e))
