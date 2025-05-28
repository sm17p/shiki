{ pkgs, lib, config, inputs, ... }:

{

  android = {
    abis = [ "arm64-v8a" "x86_64" ];
    buildTools.version = [ "34.0.0" ];
    cmake.version = [ "3.31.5" ];
    cmdLineTools.version = "11.0";
    enable = true;
    extras = [ "extras;google;gcm" ];
    extraLicenses = [
      "android-sdk-preview-license"
      "android-googletv-license"
      "android-sdk-arm-dbt-license"
      "google-gdk-license"
      "intel-android-extra-license"
      "intel-android-sysimage-license"
      "mips-android-sysimage-license"
    ];
    # googleTVAddOns.enable = true;
    # googleAPIs.enable = true;
    ndk.enable = true;
    ndk.version = [ "27.2.12479018" ];
    platformTools.version = "35.0.2";
    platforms.version = [ "34" "35" ];
    sources.enable = true;
    # systemImages.enable = true;
    # systemImageTypes = [ "google_apis_playstore" ];
    tools.version = "26.1.1";
    # emulator = {
    #   enable = true;
    #   version = "34.1.9";
    # };
  };
  # https://devenv.sh/basics/
  env.GREET = "devenv";
  env.NDK_HOME = "${config.env.ANDROID_NDK_ROOT}${lib.head config.android.ndk.version}/";
  # https://devenv.sh/packages/
  # packages = [ pkgs.git ];

  # https://devenv.sh/languages/
  # languages.rust.enable = true;

  # https://devenv.sh/processes/
  # processes.cargo-watch.exec = "cargo-watch";

  # https://devenv.sh/services/
  # services.postgres.enable = true;

  # https://devenv.sh/scripts/
  # scripts.hello.exec = ''
  #   echo hello from $GREET
  # '';

  # enterShell = ''
  #   # set -g NDK_HOME "$ANDROID_NDK_ROOT"
  #   # set --show $NDK_HOME
  # '';

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
