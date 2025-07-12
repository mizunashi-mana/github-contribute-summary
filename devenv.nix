{ pkgs, lib, config, inputs, ... }:

{
  env = {
    NODE_OPTIONS = "--experimental-vm-modules";
  };

  # https://devenv.sh/packages/
  packages = [];

  # https://devenv.sh/languages/
  languages = {
    nix.enable = true;
    javascript = {
      enable = true;
      npm = {
        enable = true;
      };
    };
  };

  # https://devenv.sh/scripts/
  scripts.hello.exec = ''
    echo hello from $GREET
  '';

  # https://devenv.sh/tasks/
  # tasks = {
  #   "myproj:setup".exec = "mytool build";
  #   "devenv:enterShell".after = [ "myproj:setup" ];
  # };

  # https://devenv.sh/tests/
  enterTest = ''
    echo "Running tests"
    git --version | grep --color=auto "${pkgs.git.version}"
  '';

  # https://devenv.sh/git-hooks/
  # git-hooks.hooks.shellcheck.enable = true;

  # See full reference at https://devenv.sh/reference/options/
}
