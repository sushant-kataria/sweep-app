#!/usr/bin/env python3
"""Generate a minimal Xcode project for Sweep without XcodeGen (Linux-friendly)."""

from __future__ import annotations

import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "Sweep"
PROJECT = Path(__file__).resolve().parents[1] / "Sweep.xcodeproj"
SWIFT_FILES = sorted(p for p in ROOT.rglob("*.swift") if p.is_file())


def uid() -> str:
    return uuid.uuid4().hex[:24].upper()


file_refs = {path: uid() for path in SWIFT_FILES}
build_files = {path: uid() for path in SWIFT_FILES}
plist_ref = uid()
assets_ref = uid()
assets_build = uid()
product_ref = uid()
main_group = uid()
products_group = uid()
sweep_group = uid()
project_id = uid()
target_id = uid()
sources_phase = uid()
resources_phase = uid()
frameworks_phase = uid()
target_config_list = uid()
project_config_list = uid()
debug_target = uid()
release_target = uid()
debug_project = uid()
release_project = uid()

file_ref_lines = []
for path in SWIFT_FILES:
    rel = path.relative_to(ROOT.parent)
    file_ref_lines.append(
        f'\t\t{file_refs[path]} /* {path.name} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = "{rel.as_posix()}"; sourceTree = SOURCE_ROOT; }};'
    )
file_ref_lines.append(
    f'\t\t{plist_ref} /* Info.plist */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Sweep/Resources/Info.plist; sourceTree = SOURCE_ROOT; }};'
)
file_ref_lines.append(
    f'\t\t{assets_ref} /* Assets.xcassets */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = Sweep/Resources/Assets.xcassets; sourceTree = SOURCE_ROOT; }};'
)
file_ref_lines.append(
    f'\t\t{product_ref} /* Sweep.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Sweep.app; sourceTree = BUILT_PRODUCTS_DIR; }};'
)

build_file_lines = [
    f"\t\t{build_files[path]} /* {path.name} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_refs[path]} /* {path.name} */; }};"
    for path in SWIFT_FILES
]
build_file_lines.append(
    f"\t\t{assets_build} /* Assets.xcassets in Resources */ = {{isa = PBXBuildFile; fileRef = {assets_ref} /* Assets.xcassets */; }};"
)

sources_list = "\n".join(
    f"\t\t\t\t{build_files[path]} /* {path.name} in Sources */," for path in SWIFT_FILES
)
group_children = "\n".join(
    f"\t\t\t\t{file_refs[path]} /* {path.name} */," for path in SWIFT_FILES
)

content = f"""// !$*UTF8*$!
{{
\tarchiveVersion = 1;
\tclasses = {{
\t}};
\tobjectVersion = 56;
\tobjects = {{

/* Begin PBXBuildFile section */
{chr(10).join(build_file_lines)}
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
{chr(10).join(file_ref_lines)}
/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
\t\t{frameworks_phase} /* Frameworks */ = {{
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
\t\t{main_group} = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t{sweep_group} /* Sweep */,
\t\t\t\t{products_group} /* Products */,
\t\t\t);
\t\t\tsourceTree = \"<group>\";
\t\t}};
\t\t{products_group} /* Products */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t{product_ref} /* Sweep.app */,
\t\t\t);
\t\t\tname = Products;
\t\t\tsourceTree = \"<group>\";
\t\t}};
\t\t{sweep_group} /* Sweep */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
{group_children}
\t\t\t\t{plist_ref} /* Info.plist */,
\t\t\t\t{assets_ref} /* Assets.xcassets */,
\t\t\t);
\t\t\tname = Sweep;
\t\t\tsourceTree = \"<group>\";
\t\t}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
\t\t{target_id} /* Sweep */ = {{
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = {target_config_list} /* Build configuration list for PBXNativeTarget \"Sweep\" */;
\t\t\tbuildPhases = (
\t\t\t\t{sources_phase} /* Sources */,
\t\t\t\t{frameworks_phase} /* Frameworks */,
\t\t\t\t{resources_phase} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = Sweep;
\t\t\tproductName = Sweep;
\t\t\tproductReference = {product_ref} /* Sweep.app */;
\t\t\tproductType = \"com.apple.product-type.application\";
\t\t}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
\t\t{project_id} /* Project object */ = {{
\t\t\tisa = PBXProject;
\t\t\tattributes = {{
\t\t\t\tBuildIndependentTargetsInParallel = 1;
\t\t\t\tLastSwiftUpdateCheck = 2600;
\t\t\t\tLastUpgradeCheck = 2600;
\t\t\t}};
\t\t\tbuildConfigurationList = {project_config_list} /* Build configuration list for PBXProject \"Sweep\" */;
\t\t\tcompatibilityVersion = \"Xcode 15.0\";
\t\t\tdevelopmentRegion = en;
\t\t\thasScannedForEncodings = 0;
\t\t\tknownRegions = (
\t\t\t\ten,
\t\t\t\tBase,
\t\t\t);
\t\t\tmainGroup = {main_group};
\t\t\tproductRefGroup = {products_group} /* Products */;
\t\t\tprojectDirPath = \"\";
\t\t\tprojectRoot = \"\";
\t\t\ttargets = (
\t\t\t\t{target_id} /* Sweep */,
\t\t\t);
\t\t}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
\t\t{resources_phase} /* Resources */ = {{
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t{assets_build} /* Assets.xcassets in Resources */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
\t\t{sources_phase} /* Sources */ = {{
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
{sources_list}
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
\t\t{debug_project} /* Debug */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;
\t\t\t\tCLANG_ENABLE_MODULES = YES;
\t\t\t\tDEBUG_INFORMATION_FORMAT = dwarf;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 26.0;
\t\t\t\tONLY_ACTIVE_ARCH = YES;
\t\t\t\tSDKROOT = iphoneos;
\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = \"DEBUG $(inherited)\";
\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = \"-Onone\";
\t\t\t\tSWIFT_VERSION = 6.0;
\t\t\t}};
\t\t\tname = Debug;
\t\t}};
\t\t{release_project} /* Release */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;
\t\t\t\tCLANG_ENABLE_MODULES = YES;
\t\t\t\tDEBUG_INFORMATION_FORMAT = \"dwarf-with-dsym\";
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 26.0;
\t\t\t\tSDKROOT = iphoneos;
\t\t\t\tSWIFT_COMPILATION_MODE = wholemodule;
\t\t\t\tSWIFT_VERSION = 6.0;
\t\t\t\tVALIDATE_PRODUCT = YES;
\t\t\t}};
\t\t\tname = Release;
\t\t}};
\t\t{debug_target} /* Debug */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tENABLE_PREVIEWS = YES;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = Sweep/Resources/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 26.0;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t\"$(inherited)\",
\t\t\t\t\t\"@executable_path/Frameworks\",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.sweep.app;
\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";
\t\t\t\tSUPPORTED_PLATFORMS = \"iphoneos iphonesimulator\";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_STRICT_CONCURRENCY = complete;
\t\t\t\tSWIFT_VERSION = 6.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = \"1,2\";
\t\t\t}};
\t\t\tname = Debug;
\t\t}};
\t\t{release_target} /* Release */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 1;
\t\t\t\tENABLE_PREVIEWS = YES;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = Sweep/Resources/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 26.0;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t\"$(inherited)\",
\t\t\t\t\t\"@executable_path/Frameworks\",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 1.0.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.sweep.app;
\t\t\t\tPRODUCT_NAME = \"$(TARGET_NAME)\";
\t\t\t\tSUPPORTED_PLATFORMS = \"iphoneos iphonesimulator\";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_STRICT_CONCURRENCY = complete;
\t\t\t\tSWIFT_VERSION = 6.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = \"1,2\";
\t\t\t}};
\t\t\tname = Release;
\t\t}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
\t\t{project_config_list} /* Build configuration list for PBXProject \"Sweep\" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{debug_project} /* Debug */,
\t\t\t\t{release_project} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
\t\t{target_config_list} /* Build configuration list for PBXNativeTarget \"Sweep\" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{debug_target} /* Debug */,
\t\t\t\t{release_target} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
/* End XCConfigurationList section */
\t}};
\trootObject = {project_id} /* Project object */;
}}
"""

PROJECT.mkdir(parents=True, exist_ok=True)
(PROJECT / "project.pbxproj").write_text(content)
scheme_dir = PROJECT / "xcshareddata" / "xcschemes"
scheme_dir.mkdir(parents=True, exist_ok=True)
(scheme_dir / "Sweep.xcscheme").write_text(
    f"""<?xml version="1.0" encoding="UTF-8"?>
<Scheme
   LastUpgradeVersion = "2600"
   version = "1.7">
   <BuildAction
      parallelizeBuildables = "YES"
      buildImplicitDependencies = "YES">
      <BuildActionEntries>
         <BuildActionEntry
            buildForTesting = "YES"
            buildForRunning = "YES"
            buildForProfiling = "YES"
            buildForArchiving = "YES"
            buildForAnalyzing = "YES">
            <BuildableReference
               BuildableIdentifier = "primary"
               BlueprintIdentifier = "{target_id}"
               BuildableName = "Sweep.app"
               BlueprintName = "Sweep"
               ReferencedContainer = "container:Sweep.xcodeproj">
            </BuildableReference>
         </BuildActionEntry>
      </BuildActionEntries>
   </BuildAction>
   <TestAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      shouldUseLaunchSchemeArgsEnv = "YES">
   </TestAction>
   <LaunchAction
      buildConfiguration = "Debug"
      selectedDebuggerIdentifier = "Xcode.DebuggerFoundation.Debugger.LLDB"
      selectedLauncherIdentifier = "Xcode.DebuggerFoundation.Launcher.LLDB"
      launchStyle = "0"
      useCustomWorkingDirectory = "NO"
      ignoresPersistentStateOnLaunch = "NO"
      debugDocumentVersioning = "YES"
      debugServiceExtension = "internal"
      allowLocationSimulation = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{target_id}"
            BuildableName = "Sweep.app"
            BlueprintName = "Sweep"
            ReferencedContainer = "container:Sweep.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
      <EnvironmentVariables>
         <EnvironmentVariable
            key = "SWEEP_API_BASE_URL"
            value = "https://sweep-app.vercel.app"
            isEnabled = "YES">
         </EnvironmentVariable>
      </EnvironmentVariables>
   </LaunchAction>
   <ProfileAction
      buildConfiguration = "Release"
      shouldUseLaunchSchemeArgsEnv = "YES"
      savedToolIdentifier = ""
      useCustomWorkingDirectory = "NO"
      debugDocumentVersioning = "YES">
      <BuildableProductRunnable
         runnableDebuggingMode = "0">
         <BuildableReference
            BuildableIdentifier = "primary"
            BlueprintIdentifier = "{target_id}"
            BuildableName = "Sweep.app"
            BlueprintName = "Sweep"
            ReferencedContainer = "container:Sweep.xcodeproj">
         </BuildableReference>
      </BuildableProductRunnable>
   </ProfileAction>
   <AnalyzeAction
      buildConfiguration = "Debug">
   </AnalyzeAction>
   <ArchiveAction
      buildConfiguration = "Release"
      revealArchiveInOrganizer = "YES">
   </ArchiveAction>
</Scheme>
"""
)
print(f"Wrote {PROJECT} with {len(SWIFT_FILES)} Swift files")
for p in SWIFT_FILES:
    print(" -", p.relative_to(ROOT.parent))
