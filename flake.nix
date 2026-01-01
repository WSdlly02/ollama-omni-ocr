{
  description = "Flake for findtrue.me websites";

  inputs = {
    nixpkgs.url = "https://channels.nixos.org/nixos-unstable/nixexprs.tar.xz";
  };

  outputs =
    inputs:
    let
      inherit (inputs.nixpkgs) lib;
      inherit (inputs.self.lib) pkgs';
      exposedSystems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forExposedSystems = f: builtins.foldl' lib.recursiveUpdate { } (map f exposedSystems);
    in
    {
      lib.pkgs' =
        {
          nixpkgsInstance ? inputs.nixpkgs,
          config ? { },
          overlays ? [ ],
          system,
        }:
        import nixpkgsInstance {
          inherit system;
          config = {
            allowAliases = false;
            allowUnfree = true;
          }
          // config;
          overlays = [
            inputs.self.overlays.default
          ]
          ++ overlays;
        };
      overlays.default =
        final: prev: with prev; {
          # python3 = python3.override {
          #   packageOverrides = pyfinal: pyprev: {
          #     llama-cpp-python = pyprev.llama-cpp-python.overrideAttrs (
          #       finalAttrs: previousAttrs: {
          #         cmakeFlags = previousAttrs.cmakeFlags ++ [ "-DGGML_HIPBLAS=on" ];
          #         buildInputs = previousAttrs.buildInputs ++ [ rocmPackages.hipblas ];
          #       }
          #     );
          #   };
          # };
        };
    }
    // forExposedSystems (
      system: with (pkgs' { inherit system; }); {
        devShells."${system}" = {
          default = mkShell rec {
            packages = [
              dbus
              glibcLocales
              glibc
              gcc.cc.lib
              coreutils
              less
              shadow
              su
              gawk
              diffutils
              findutils
              gnused
              gnugrep
              gnutar
              gzip
              bzip2
              xz
              udev
              zlib
              zstd
            ]
            ++ [
              nodejs
              npm-check-updates
            ];
            shellHook = ''
              export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath packages}:$LD_LIBRARY_PATH
            '';
          };
        };
        formatter."${system}" = nixfmt-tree;
        legacyPackages."${system}" = { };
      }
    );

}
