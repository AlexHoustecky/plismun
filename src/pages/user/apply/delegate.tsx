import React, { useCallback, useEffect, useReducer, useState } from "react"
import Header from "@/components/header"
import { useAppSelector } from "@/utils/redux/hooks"
import {
  Button,
  Center,
  Container,
  Divider,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  Input,
  Text,
  Textarea,
} from "@chakra-ui/react"
import { Select, OptionBase } from "chakra-react-select"
import { DelegateApply, refineDelegateApply } from "@/utils/validators"
import { useFormik } from "formik"
import Link from "next/link"
import { Committee, CommitteeCountries, Delegation } from "@prisma/client"
import { GetStaticPropsResult } from "next"
import { db } from "@/utils/db"
import { useDebouncedCallback } from "use-debounce"

interface DelegateAppProps {
  committees: Committee[]
  countries: CommitteeCountries[]
  delegations: Delegation[]
}

interface CommitteeChoice extends OptionBase {
  label: string
  value: number
}
interface CountryChoice extends OptionBase {
  label: string
  value: string
}

export default function Signup({
  committees,
  countries,
  delegations,
}: DelegateAppProps) {
  const userData = useAppSelector((state) => state.user)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean | null>(null)

  const submitApplication = async (form: DelegateApply) => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await fetch("/api/user/application/delegate", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      setLoading(false)

      if (result.status === 201) {
        setSuccess(true)
      } else {
        setError("An unknown error occured")
      }
      return
    } catch (err) {
      setError(err as string)
      setSuccess(false)
      setLoading(false)
    }
  }

  const { setFieldValue, values, handleSubmit, errors } =
    useFormik<DelegateApply>({
      initialValues: {
        userId: userData.user?.id ?? -1,
        motivation: "",
        experience: "",
        delegationId: null,
        choice1committee: -1,
        choice1country: "",
        choice2committee: -1,
        choice2country: "",
        choice3committee: -1,
        choice3country: "",
        shirtSize: null,
      },
      onSubmit: submitApplication,
      validate: async (values) => {
        // this function should return errors it finds
        const results = await DelegateApply.superRefine(
          refineDelegateApply({ committees, committeeCountries: countries })
        ).safeParseAsync(values)

        // if success, return an empty object (no errors)
        if (results.success) return {}
        // here we need to map the errors to the form fields

        // this is an object of fieldname:list of errors
        // we can however only have one error at a time, so we need to change that
        const errors = results.error.flatten().fieldErrors as Partial<
          Record<keyof DelegateApply, string[]>
        >

        const newErrors = {}
        for (const [field, error] of Object.entries(errors)) {
          // @ts-expect-error
          newErrors[field] = error[0]
        }

        return newErrors
      },
    })

  // we have this debounced change handler so that the motivation+experience don't get changed on each keystroke, but only after the user stopped typing for 500ms
  const debouncedHandleChange = useDebouncedCallback(
    (field: string, value: any) => setFieldValue(field, value),
    500
  )
  // stuff that is shown when the user is not logged in
  if (!userData.user) {
    return (
      <Container maxW="110ch">
        <Header title="DELEGATE APPLICATIONS" />

        <Heading>DELEGATE APPLICATIONS</Heading>

        <br />
        <Text>
          You are not logged in to your PLISMUN account, therefore you cannot
          apply
        </Text>
        <Text>
          You can log in to your existing account{" "}
          <Link href="/user/login">here</Link>, or you can create a new account{" "}
          <Link href="/user/signup">here</Link>
        </Text>
      </Container>
    )
  }

  if (userData.application) {
    return (
      <Container maxW="110ch">
        <Header title="DELEGATE APPLICATIONS" />

        <Heading>DELEGATE APPLICATIONS</Heading>

        <br />
        <Text>
          You have already applied to be a {userData.application.type}, you
          therefore cannot apply again
        </Text>
        <Text>
          You can go back to the main page
          <Link href="/">here</Link>
        </Text>
      </Container>
    )
  }

  // this function checks whether a committee ID should be disabled for a selection control
  // this checks whether the other two committee IDs have this committee ID selected, if they do, it should be disabled on this one
  const checkShouldBeDisabled = (committeeId: number, choiceId: number) => {
    const otherChoiceIds = ([1, 2, 3] as const).filter((id) => id !== choiceId)
    const otherChoicesAreSame = otherChoiceIds.map((id) => {
      const selectedCommitteeId = values[`choice${id}committee`]
      return selectedCommitteeId === committeeId
    })
    if (otherChoicesAreSame.some((isSame) => isSame == true)) return true
    return false
  }

  const choice1committee =
    values.choice1committee !== undefined
      ? committees.find(
          (committee) => committee.id === values.choice1committee
        ) || false
      : false
  const choice2committee =
    values.choice2committee !== undefined
      ? committees.find(
          (committee) => committee.id === values.choice2committee
        ) || false
      : false
  const choice3committee =
    values.choice3committee !== undefined
      ? committees.find(
          (committee) => committee.id === values.choice3committee
        ) || false
      : false

  // stuff that is shown when the user is logged in
  return (
    <Container maxW="110ch">
      <Header title="DELEGATE APPLICATIONS" />

      <br />

      <Heading>Information for delegates</Heading>
      {/* some more specific information here */}

      <br />

      {loading && <Heading>Loading...</Heading>}
      {error && <Heading>{error}</Heading>}
      {success && (
        <>
          <Heading>You have successfully applied to be a delegate</Heading>
          <br />
          <Text>
            Go back <Link href="/">home</Link>
          </Text>
        </>
      )}

      {/* application form */}
      {!success && (
        <form onSubmit={handleSubmit}>
          {/* committee choices */}
          <Grid
            width="100%"
            templateRows="repeat(2, 0.1fr)"
            templateColumns="repeat(6, 1fr)"
            gap={4}
            style={{ paddingBottom: "2rem" }}
          >
            {/* committee choices */}
            <GridItem rowSpan={1} colSpan={2}>
              <FormControl
                isInvalid={Boolean(errors.choice1committee)}
                isRequired
              >
                <FormLabel>Committee Choice 1</FormLabel>
                <Select<CommitteeChoice, false>
                  options={committees.map((committee) => ({
                    label: committee.displayname,
                    value: committee.id,
                    isDisabled: checkShouldBeDisabled(committee.id, 1),
                  }))}
                  placeholder="Select a committee"
                  closeMenuOnSelect
                  selectedOptionColor="green"
                  onChange={(option) =>
                    setFieldValue("choice1committee", option?.value ?? -1)
                  }
                  isInvalid={Boolean(errors.choice1committee)}
                />
                {errors.choice1committee ? (
                  <FormErrorMessage>{errors.choice1committee}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Select your first committee choice
                  </FormHelperText>
                )}
              </FormControl>
            </GridItem>

            <GridItem rowSpan={1} colSpan={2}>
              <FormControl
                isInvalid={Boolean(errors.choice2committee)}
                isRequired
              >
                <FormLabel>Committee Choice 2</FormLabel>
                <Select<CommitteeChoice, false>
                  options={committees.map((committee) => ({
                    label: committee.displayname,
                    value: committee.id,
                    isDisabled: checkShouldBeDisabled(committee.id, 2),
                  }))}
                  placeholder="Select a committee"
                  closeMenuOnSelect
                  selectedOptionColor="green"
                  onChange={(option) =>
                    setFieldValue("choice2committee", option?.value ?? -1)
                  }
                  isInvalid={Boolean(errors.choice2committee)}
                />
                {errors.choice2committee ? (
                  <FormErrorMessage>{errors.choice2committee}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Select your second committee choice
                  </FormHelperText>
                )}
              </FormControl>
            </GridItem>

            <GridItem rowSpan={1} colSpan={2}>
              <FormControl
                isInvalid={Boolean(errors.choice3committee)}
                isRequired
              >
                <FormLabel>Committee Choice 3</FormLabel>
                <Select<CommitteeChoice, false>
                  options={committees.map((committee) => ({
                    label: committee.displayname,
                    value: committee.id,
                    isDisabled: checkShouldBeDisabled(committee.id, 3),
                  }))}
                  placeholder="Select a committee"
                  closeMenuOnSelect
                  selectedOptionColor="green"
                  onChange={(option) =>
                    setFieldValue("choice3committee", option?.value ?? -1)
                  }
                  isInvalid={Boolean(errors.choice3committee)}
                />
                {errors.choice3committee ? (
                  <FormErrorMessage>{errors.choice3committee}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Select your third committee choice
                  </FormHelperText>
                )}
              </FormControl>
            </GridItem>

            {/* country choices */}

            <GridItem rowSpan={1} colSpan={2}>
              <FormControl
                isInvalid={Boolean(errors.choice1country)}
                isRequired
              >
                <FormLabel>Country Choice 1</FormLabel>
                <Select<CountryChoice, false>
                  // filter to only include countries in the specific committee that is selected for the choice
                  options={countries
                    .filter(
                      (country) =>
                        country.committeeId === Number(values.choice1committee)
                    )
                    .map((country) => ({
                      label: country.country,
                      value: country.country,
                    }))}
                  isDisabled={values.choice1committee === -1}
                  onChange={(option) =>
                    setFieldValue("choice1country", option?.value ?? "")
                  }
                  isInvalid={Boolean(errors.choice1country)}
                />
                {errors.choice1country ? (
                  <FormErrorMessage>{errors.choice1country}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Select a country that you want to delegate as in the{" "}
                    {choice1committee ? choice1committee.displayname : "3rd"}{" "}
                    committee
                  </FormHelperText>
                )}
              </FormControl>
            </GridItem>

            <GridItem rowSpan={1} colSpan={2}>
              <FormControl
                isInvalid={Boolean(errors.choice2country)}
                isRequired
              >
                <FormLabel>Country Choice 2</FormLabel>
                <Select<CountryChoice, false>
                  // filter to only include countries in the specific committee that is selected for the choice
                  options={countries
                    .filter(
                      (country) =>
                        country.committeeId === Number(values.choice2committee)
                    )
                    .map((country) => ({
                      label: country.country,
                      value: country.country,
                    }))}
                  isDisabled={values.choice2committee === -1}
                  onChange={(option) =>
                    setFieldValue("choice2country", option?.value ?? "")
                  }
                  isInvalid={Boolean(errors.choice2country)}
                />
                {errors.choice2country ? (
                  <FormErrorMessage>{errors.choice2country}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Select a country that you want to delegate as in the{" "}
                    {choice2committee ? choice2committee.displayname : "3rd"}{" "}
                    committee
                  </FormHelperText>
                )}
              </FormControl>
            </GridItem>

            <GridItem rowSpan={1} colSpan={2}>
              <FormControl
                isInvalid={Boolean(errors.choice3country)}
                isRequired
              >
                <FormLabel>Country Choice 3</FormLabel>
                <Select<CountryChoice, false>
                  // filter to only include countries in the specific committee that is selected for the choice
                  options={countries
                    .filter(
                      (country) =>
                        country.committeeId === Number(values.choice3committee)
                    )
                    .map((country) => ({
                      label: country.country,
                      value: country.country,
                    }))}
                  isDisabled={values.choice3committee === -1}
                  onChange={(option) =>
                    setFieldValue("choice3country", option?.value ?? "")
                  }
                  isInvalid={Boolean(errors.choice3country)}
                />
                {errors.choice3country ? (
                  <FormErrorMessage>{errors.choice3country}</FormErrorMessage>
                ) : (
                  <FormHelperText>
                    Select a country that you want to delegate as in the{" "}
                    {choice3committee ? choice3committee.displayname : "3rd"}{" "}
                    committee
                  </FormHelperText>
                )}
              </FormControl>
            </GridItem>
          </Grid>

          <Divider />

          <br />

          <FormControl isInvalid={Boolean(errors.delegationId)} isRequired>
            <FormLabel>Delegation</FormLabel>
            <Select<CommitteeChoice, false>
              options={[
                {
                  name: "None",
                  delegationId: -1,
                },
                ...delegations,
              ].map((delegation) => ({
                label: delegation.name,
                value: delegation.delegationId,
              }))}
              placeholder="Select a delegation"
              onChange={(option) =>
                setFieldValue("delegationId", option?.value ?? null)
              }
              defaultValue={{
                label: "None",
                value: -1,
              }}
              isInvalid={Boolean(errors.delegationId)}
            />

            {errors.delegationId ? (
              <FormErrorMessage>{errors.delegationId}</FormErrorMessage>
            ) : (
              <FormHelperText>
                Select a delegation that you are part of if you are part of one.
                This is something that your club leader or teacher would have
                told you about. Don't worry about it if you are not partaking in
                PLISMUN as a club member or as a part of a school
              </FormHelperText>
            )}
          </FormControl>

          <br />

          <FormControl isInvalid={Boolean(errors.motivation)} isRequired>
            <FormLabel>Motivation</FormLabel>
            <Textarea
              // onChange={(e) => setMotivation(e.target.value)}
              onChange={(e) =>
                debouncedHandleChange("motivation", e.target.value)
              }
              isInvalid={Boolean(errors.motivation)}
              height="20em"
            />
            {errors.motivation ? (
              <FormErrorMessage>{errors.motivation}</FormErrorMessage>
            ) : (
              <FormHelperText>
                Fill in some motivation about why you would like to attend
                PLISMUN as a delegate here (approx. 400 words)
              </FormHelperText>
            )}
          </FormControl>

          <br />

          <FormControl isInvalid={Boolean(errors.experience)} isRequired>
            <FormLabel>Experience</FormLabel>
            <Textarea
              onChange={(e) =>
                debouncedHandleChange("experience", e.target.value)
              }
              isInvalid={Boolean(errors.experience)}
              height="20em"
            />
            {errors.experience ? (
              <FormErrorMessage>{errors.experience}</FormErrorMessage>
            ) : (
              <FormHelperText>
                Fill in some experience about your past experiences with
                PLISMUN, other MUN conferences, or other related work here
                (approx. 400 words)
              </FormHelperText>
            )}
          </FormControl>

          <FormControl isInvalid={Boolean(errors.shirtSize)} isRequired>
            <FormLabel>Shirt Size</FormLabel>
            <Select<{ value: string | null; label: string } & OptionBase, false>
              options={[
                {
                  label: "None",
                  value: null,
                },
                {
                  value: "XS",
                  label: "XS",
                },
                {
                  value: "S",
                  label: "S",
                },
                {
                  value: "M",
                  label: "M",
                },
                {
                  value: "L",
                  label: "L",
                },
                {
                  value: "XL",
                  label: "XL",
                },
                {
                  value: "XXL",
                  label: "XXL",
                },
              ]}
              placeholder="Select a shirt size"
              onChange={(option) =>
                setFieldValue("shirtSize", option?.value ?? null)
              }
            />
            {errors.shirtSize ? (
              <FormErrorMessage>{errors.shirtSize}</FormErrorMessage>
            ) : (
              <FormHelperText>
                Select a shirt size or none if you don't want one
              </FormHelperText>
            )}
          </FormControl>

          <Center>
            <Button type="submit">Submit application</Button>
          </Center>
        </form>
      )}
    </Container>
  )
}

export async function getStaticProps(): Promise<
  GetStaticPropsResult<DelegateAppProps>
> {
  const committees = await db.committee.findMany()
  const countries = await db.committeeCountries.findMany()
  const delegations = await db.delegation.findMany()

  return {
    props: {
      committees,
      countries,
      delegations,
    },

    // re-generate the page's data at most every 24h (60s*60m*24h)
    // re-generates ONLY if a request comes in, it doesn't re-generate the page if no requests come in
    revalidate: 60 * 60 * 24,
  }
}
