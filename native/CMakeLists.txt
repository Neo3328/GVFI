cmake_minimum_required(VERSION 3.20)
project(gvfi_native LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(GVFI_NATIVE_SOURCES
  src/work_loop.cpp
  src/event_source.cpp
  src/memory_pressure.cpp
  src/zone_pool.cpp
  src/gvfi_capi.cpp
)

add_library(gvfi_native SHARED ${GVFI_NATIVE_SOURCES})
target_include_directories(gvfi_native PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_definitions(gvfi_native PRIVATE WIN32_LEAN_AND_MEAN NOMINMAX GVFI_NATIVE_EXPORTS)
if(MSVC)
  target_compile_options(gvfi_native PRIVATE /W4 /permissive-)
else()
  target_compile_options(gvfi_native PRIVATE -Wall -Wextra -Wpedantic)
endif()

# Also keep a static lib for unit tests linking.
add_library(gvfi_native_static STATIC ${GVFI_NATIVE_SOURCES})
target_include_directories(gvfi_native_static PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
target_compile_definitions(gvfi_native_static PRIVATE WIN32_LEAN_AND_MEAN NOMINMAX GVFI_NATIVE_EXPORTS)
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
