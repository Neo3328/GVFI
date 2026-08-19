cmake_minimum_required(VERSION 3.20)
project(gvfi_native LANGUAGES CXX)

option(ENABLE_NCNN_BACKEND "Build the experimental ncnn Vulkan backend" OFF)

if(MSVC)
  # Keep the native DLL independent of process-wide MSVC runtime load order.
  set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(GVFI_NATIVE_SOURCES
  src/work_loop.cpp
  src/event_source.cpp
  src/memory_pressure.cpp
  src/zone_pool.cpp
  src/gvfi_capi.cpp
  src/gvfi_native.cpp
)

if(ENABLE_NCNN_BACKEND)
  find_package(Vulkan REQUIRED)
  find_package(ncnn CONFIG REQUIRED)
  if(DEFINED NCNN_VULKAN AND NOT NCNN_VULKAN)
    message(FATAL_ERROR "ENABLE_NCNN_BACKEND requires ncnn built with NCNN_VULKAN=ON")
  endif()
  set(RIFE_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third_party/rife)
  set(RIFE_SHADER_HEADERS)

  macro(gvfi_add_rife_shader shader_name)
    get_filename_component(shader_stem ${shader_name} NAME_WE)
    set(shader_header ${CMAKE_CURRENT_BINARY_DIR}/${shader_stem}.comp.hex.h)
    add_custom_command(
      OUTPUT ${shader_header}
      COMMAND ${CMAKE_COMMAND}
              -DSHADER_SRC=${RIFE_SOURCE_DIR}/${shader_name}
              -DSHADER_COMP_HEADER=${shader_header}
              -P ${RIFE_SOURCE_DIR}/generate_shader_comp_header.cmake
      DEPENDS ${RIFE_SOURCE_DIR}/${shader_name}
      VERBATIM
    )
    list(APPEND RIFE_SHADER_HEADERS ${shader_header})
  endmacro()

  foreach(shader
      rife_preproc.comp
      rife_postproc.comp
      rife_preproc_tta.comp
      rife_postproc_tta.comp
      rife_flow_tta_avg.comp
      rife_v2_flow_tta_avg.comp
      rife_v4_flow_tta_avg.comp
      rife_flow_tta_temporal_avg.comp
      rife_v2_flow_tta_temporal_avg.comp
      rife_v4_flow_tta_temporal_avg.comp
      rife_out_tta_temporal_avg.comp
      rife_v4_timestep.comp
      rife_v4_timestep_tta.comp
      warp.comp
      warp_pack4.comp
      warp_pack8.comp)
    gvfi_add_rife_shader(${shader})
  endforeach()

  list(APPEND GVFI_NATIVE_SOURCES
    src/ncnn_vulkan_backend.cpp
    src/batch_rife_worker.cpp
    src/batch_profile.cpp
    src/pipeline_rife_worker.cpp
    src/pipeline_poc_capi.cpp
    ${RIFE_SOURCE_DIR}/rife.cpp
    ${RIFE_SOURCE_DIR}/warp.cpp
    ${RIFE_SOURCE_DIR}/process_v4_batch.cpp
    ${RIFE_SHADER_HEADERS}
  )
endif()

add_library(gvfi_native SHARED ${GVFI_NATIVE_SOURCES})
target_include_directories(gvfi_native PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_definitions(gvfi_native PRIVATE WIN32_LEAN_AND_MEAN NOMINMAX GVFI_NATIVE_EXPORTS)
if(ENABLE_NCNN_BACKEND)
  target_compile_definitions(gvfi_native PRIVATE GVFI_ENABLE_NCNN_BACKEND=1)
  target_include_directories(gvfi_native PRIVATE ${RIFE_SOURCE_DIR} ${CMAKE_CURRENT_BINARY_DIR})
  target_link_libraries(gvfi_native PRIVATE ncnn Vulkan::Vulkan)
endif()
if(MSVC)
  target_compile_options(gvfi_native PRIVATE /W4 /permissive-)
else()
  target_compile_options(gvfi_native PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Also keep a static lib for unit tests linking.
add_library(gvfi_native_static STATIC ${GVFI_NATIVE_SOURCES})
target_include_directories(gvfi_native_static PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_definitions(gvfi_native_static PRIVATE WIN32_LEAN_AND_MEAN NOMINMAX GVFI_NATIVE_EXPORTS)
if(ENABLE_NCNN_BACKEND)
  target_compile_definitions(gvfi_native_static PRIVATE GVFI_ENABLE_NCNN_BACKEND=1)
  target_include_directories(gvfi_native_static PRIVATE ${RIFE_SOURCE_DIR} ${CMAKE_CURRENT_BINARY_DIR})
  target_link_libraries(gvfi_native_static PRIVATE ncnn Vulkan::Vulkan)
endif()
if(MSVC)
  target_compile_options(gvfi_native_static PRIVATE /W4 /permissive-)
else()
  target_compile_options(gvfi_native_static PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Copy DLL next to tests / into python package on build.
add_custom_command(TARGET gvfi_native POST_BUILD
  COMMAND ${CMAKE_COMMAND} -E make_directory
          "${CMAKE_SOURCE_DIR}/../ECCV2022-RIFE/gvfi_runtime/native_bin"
  COMMAND ${CMAKE_COMMAND} -E copy_if_different
          $<TARGET_FILE:gvfi_native>
          "${CMAKE_SOURCE_DIR}/../ECCV2022-RIFE/gvfi_runtime/native_bin/$<TARGET_FILE_NAME:gvfi_native>"
)

enable_testing()

function(gvfi_add_test name src)
  add_executable(${name} ${src})
  target_link_libraries(${name} PRIVATE gvfi_native_static)
  add_test(NAME ${name} COMMAND ${name})
endfunction()

gvfi_add_test(test_work_loop tests/test_work_loop.cpp)
gvfi_add_test(test_zone_pool tests/test_zone_pool.cpp)
gvfi_add_test(test_memory_pressure tests/test_memory_pressure.cpp)
gvfi_add_test(test_native_cabi tests/test_native_cabi.cpp)
