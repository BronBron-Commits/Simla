CC ?= cc
CFLAGS ?= -Wall -Wextra -std=c11

SIMLA = simla
COMPILE_TEST = compile_test
SHARED_BC_RUN = shared_bytecode_run

all: $(SIMLA) $(COMPILE_TEST) $(SHARED_BC_RUN)

$(SIMLA): simla.c
	$(CC) $(CFLAGS) -o $(SIMLA) simla.c

$(COMPILE_TEST): vm.c compile_test.c bytecode.h
	$(CC) $(CFLAGS) vm.c compile_test.c -o $(COMPILE_TEST)

$(SHARED_BC_RUN): vm.c shared_bytecode_run.c bytecode.h
	$(CC) $(CFLAGS) vm.c shared_bytecode_run.c -o $(SHARED_BC_RUN)

test:
	cd .. && ./c-simla/run_tests.sh

bytecode:
	cd .. && ./c-simla/run_bytecode_tests.sh

parity:
	cd .. && ./c-simla/run_parity_tests.sh

errors:
	cd .. && ./c-simla/run_error_tests.sh

check: test bytecode parity errors

clean:
	rm -f $(SIMLA) $(COMPILE_TEST) $(SHARED_BC_RUN) vm_test

.PHONY: all test bytecode parity errors check clean
